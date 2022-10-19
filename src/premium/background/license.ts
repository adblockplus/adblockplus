/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import { installHandler } from "../../../adblockpluschrome/lib/messaging/events";
import { port } from "../../../adblockpluschrome/lib/messaging/port";
import { EventEmitter } from "../../../adblockpluschrome/lib/events";
import { Prefs } from "../../../adblockpluschrome/lib/prefs";
import * as scheduledEmitter from "../../core/scheduled-event-emitter/background/scheduled-event-emitter";

import { PremiumActivateOptions } from "../../../js/api";
import { ScheduleType } from "../../core/scheduled-event-emitter/background/scheduled-event-emitter.types";
import { EventEmitterCallback } from "../../polyfills/background";
import { License, LicenseCheckPayload, PremiumState } from "./license.types";

// We want to obtain the reference to the global object from a
// dedicated service eventually, so let's prepare for that.
const global: WindowOrWorkerGlobalScope =
  // eslint-disable-next-line no-restricted-globals
  typeof window !== "undefined" ? window : self;

/**
 * Error indicating a temporary problem during a license check,
 * which could be resolved by a later retry
 */
class TemporaryLicenseCheckError extends Error {}

/**
 * Emitter for license events
 */
export const emitter = new EventEmitter();

/**
 * Delay between regular license checks in milliseconds
 */
const licenseCheckPeriod = 24 * 60 * 60 * 1000; // 24:00:00

/**
 * Current timeout for regular license checks
 */
let licenseCheckTimeoutId: number | null = null;

/**
 * Delay between license check retries in milliseconds
 */
const licenseCheckRetryDelay = 60 * 1000; // 00:01:00

/**
 * Event name for license check retries schedule
 */
const licenseCheckRetryEventName = "premium.license.check.retry";

/**
 * Activate or replace the Premium license
 *
 * @param oldLicense - Existing Premium license
 * @param newLicense - New/updated Premium license
 */
function activateLicense(oldLicense: License, newLicense: License): void {
  Prefs.set("premium_license", newLicense);

  scheduledEmitter.removeSchedule(licenseCheckRetryEventName);

  if (oldLicense.status === "active") {
    emitter.emit("updated");
  } else {
    // We cannot set up multi-session license checks using either
    // scheduled-event-emitter or browser.action. Therefore we're using a
    // continuous series of timeouts to ensure that the license checks
    // are properly reinitialized whenever the extension loads.
    // https://gitlab.com/adblockinc/ext/adblockplus/adblockplusui/-/issues/1267
    scheduleNextLicenseCheck(null);
    emitter.emit("activated");
  }
}

/**
 * Check for updates to Premium license
 *
 * @param retryCount - Number of times the license check was retried
 */
async function checkLicense(retryCount: number = 0): Promise<void> {
  // Stop retrying but keep existing license for now, assuming that we are
  // temporarily unable to retrieve the license from the server
  if (retryCount >= 3) {
    scheduledEmitter.removeSchedule(licenseCheckRetryEventName);
    if (retryCount > 3) {
      return;
    }
  }

  const userId = Prefs.get("premium_user_id") as string;
  if (!userId) {
    return;
  }

  try {
    if (!navigator.onLine) {
      throw new TemporaryLicenseCheckError("No network connection");
    }

    const requestData = {
      cmd: "license_check",
      u: userId,
      v: "1"
    } as LicenseCheckPayload;
    const requestUrl = Prefs.get("premium_license_check_url") as string;
    const response = await fetch(requestUrl, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const { status } = response;

      if (status >= 400 && status <= 499) {
        throw new Error(`Request failed (code: ${status})`);
      }

      if (status >= 500 && status <= 599) {
        throw new TemporaryLicenseCheckError(
          `Received error response (code: ${status})`
        );
      }

      console.error(`Received unexpected response (code: ${status})`);
      return;
    }

    const oldLicense = Prefs.get("premium_license") as License;
    const newLicense = (await response.json()) as License;

    if (newLicense.lv !== 1) {
      throw new Error(`Invalid license version: ${newLicense.lv}`);
    }

    if (oldLicense.status === "active" && newLicense.status === "expired") {
      throw new Error("Expired license");
    }

    if (newLicense.status !== "active") {
      throw new Error(`Unknown license status: ${newLicense.status}`);
    }

    activateLicense(oldLicense, newLicense);
  } catch (ex) {
    if (ex instanceof TemporaryLicenseCheckError) {
      console.warn(`Premium license check failed (retries: ${retryCount})`, ex);
      if (retryCount > 0) {
        return;
      }

      scheduledEmitter.setSchedule(
        licenseCheckRetryEventName,
        licenseCheckRetryDelay,
        ScheduleType.interval
      );
      return;
    }

    console.error("Premium license check failed", ex);
    deactivateLicense();
  }
}

/**
 * Deactivate the existing Premium license
 */
function deactivateLicense(): void {
  Prefs.reset("premium_license");
  Prefs.reset("premium_license_nextcheck");
  Prefs.reset("premium_user_id");

  scheduledEmitter.removeSchedule(licenseCheckRetryEventName);
  if (licenseCheckTimeoutId !== null) {
    global.clearTimeout(licenseCheckTimeoutId);
  }

  emitter.emit("deactivated");
}

/**
 * Provides information about Premium state
 *
 * @returns Premium state information
 */
function getPremiumState(): PremiumState {
  return { isActive: hasActiveLicense() };
}

/**
 * Check whether there is an active Premium license
 *
 * @returns whether an active Premium license exists
 */
function hasActiveLicense(): boolean {
  const license = Prefs.get("premium_license") as License;
  return license.status === "active";
}

/**
 * Initializes Premium license and license checks
 */
export function initialize(): void {
  initializeMessaging();
  initializeLicenseChecks();
}

/**
 * Schedules next license check
 *
 * @param nextTimestamp - Timestamp of next license check
 */
function scheduleNextLicenseCheck(nextTimestamp: number | null): void {
  if (!nextTimestamp) {
    /* eslint-disable-next-line no-param-reassign */
    nextTimestamp = Date.now() + licenseCheckPeriod;
    Prefs.set("premium_license_nextcheck", nextTimestamp);
  }

  // We cannot use scheduled-event-emitter to schedule delayed intervals, or
  // for rescheduling an event when it is emitted.
  // https://gitlab.com/adblockinc/ext/adblockplus/adblockplusui/-/issues/1227
  licenseCheckTimeoutId = global.setTimeout(() => {
    checkLicense();
    scheduleNextLicenseCheck(null);
  }, nextTimestamp - Date.now());
}

/**
 * Initializes license checks
 */
function initializeLicenseChecks(): void {
  scheduledEmitter.setListener(licenseCheckRetryEventName, (info) => {
    checkLicense(info.callCount);
  });

  const nextCheckTimestamp = Prefs.get("premium_license_nextcheck");
  if (!nextCheckTimestamp) {
    return;
  }

  scheduleNextLicenseCheck(nextCheckTimestamp);
}

/**
 * Initializes Messaging API endpoints
 */
function initializeMessaging(): void {
  port.on("premium.activate", async (msg: PremiumActivateOptions) => {
    if (!msg.userId) {
      return false;
    }

    // The Premium license doesn't contain the Premium user ID,
    // so we need to store it separately for the time being
    Prefs.set("premium_user_id", msg.userId);
    await checkLicense();

    return true;
  });

  port.on("premium.get", () => getPremiumState());

  installHandler(
    "premium",
    "changed",
    (emit: EventEmitterCallback<PremiumState>) => {
      const onChanged = () => emit(getPremiumState());
      emitter.on("activated", onChanged);
      emitter.on("deactivated", onChanged);
      return () => {
        emitter.off("activated", onChanged);
        emitter.off("deactivated", onChanged);
      };
    }
  );

  ext.addTrustedMessageTypes(Prefs.get("premium_license_activation_origin"), [
    "premium.activate"
  ]);
}
