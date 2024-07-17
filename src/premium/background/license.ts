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

import {
  addTrustedMessageTypes,
  installHandler,
  port
} from "../../core/api/background";
import { EventEmitter } from "../../../adblockpluschrome/lib/events";
import { Prefs } from "../../../adblockpluschrome/lib/prefs";
import * as scheduledEmitter from "../../core/scheduled-event-emitter/background/scheduled-event-emitter";

import { type Message, isPremiumActivateOptions } from "../../core/api/shared";
import { ScheduleType } from "../../core/scheduled-event-emitter/background/scheduled-event-emitter.types";
import { type EventEmitterCallback } from "../../polyfills/background";
import { type PremiumState } from "../shared";
import { type License, type LicenseCheckPayload } from "./license.types";

/**
 * Error indicating an invalid license received from the server
 */
class InvalidLicenseError extends Error {}

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
  void Prefs.set("premium_license", newLicense);

  void scheduledEmitter.removeSchedule(licenseCheckRetryEventName);

  if (oldLicense.status === "active") {
    emitter.emit("updated");
  } else {
    // We cannot set up multi-session license checks using either
    // scheduled-event-emitter or browser.action. Therefore we're using a
    // continuous series of timeouts to ensure that the license checks
    // are properly reinitialized whenever the extension loads.
    // https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/issues/1267
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
    void scheduledEmitter.removeSchedule(licenseCheckRetryEventName);
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
      throw new Error("No network connection");
    }

    const requestData: LicenseCheckPayload = {
      cmd: "license_check",
      u: userId,
      v: "1"
    };
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
        throw new Error(`Received error response (code: ${status})`);
      }

      console.error(`Received unexpected response (code: ${status})`);
      return;
    }

    const oldLicense = Prefs.get("premium_license") as License;
    const newLicense = (await response.json()) as License;

    const { lv: licenseVersion } = newLicense;
    if (licenseVersion !== 1) {
      throw new InvalidLicenseError(
        `Invalid license version: ${String(licenseVersion)}`
      );
    }

    if (oldLicense.status === "active" && newLicense.status === "expired") {
      throw new InvalidLicenseError("Expired license");
    }

    if (newLicense.status !== "active") {
      throw new InvalidLicenseError(
        `Unknown license status: ${newLicense.status}`
      );
    }

    // There's no guarantee that the server will send the License code in all requests,
    // but we need it for Premium user authentification in the Premium manage page
    if (!newLicense.code) {
      if (!oldLicense.code) {
        throw new InvalidLicenseError("Undefined license code");
      }

      newLicense.code = oldLicense.code;
    }

    activateLicense(oldLicense, newLicense);
  } catch (ex) {
    if (ex instanceof InvalidLicenseError) {
      console.error("Invalid Premium license", ex);
      deactivateLicense();
    } else {
      console.warn(`Premium license check failed (retries: ${retryCount})`, ex);
      if (retryCount > 0) {
        return;
      }

      void scheduledEmitter.setSchedule(
        licenseCheckRetryEventName,
        licenseCheckRetryDelay,
        ScheduleType.interval
      );
    }
  }
}

/**
 * Deactivate the existing Premium license
 */
function deactivateLicense(): void {
  void Prefs.reset("premium_license");
  void Prefs.reset("premium_license_nextcheck");
  void Prefs.reset("premium_user_id");

  void scheduledEmitter.removeSchedule(licenseCheckRetryEventName);
  if (licenseCheckTimeoutId !== null) {
    self.clearTimeout(licenseCheckTimeoutId);
  }

  emitter.emit("deactivated");
}

/**
 * Provides payload to verify authenticity of Premium license data
 *
 * @returns Encoded signed Premium license data
 */
export function getAuthPayload(): string | null {
  if (!hasActiveLicense()) {
    return null;
  }

  const license = Prefs.get("premium_license") as License;
  return `${license.encodedData}.${license.signature}`;
}

/**
 * Provides information about Premium state
 *
 * @returns Premium state information
 */
export function getPremiumState(): PremiumState {
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
 * Schedules next license check
 *
 * @param nextTimestamp - Timestamp of next license check
 */
function scheduleNextLicenseCheck(nextTimestamp: number | null): void {
  if (!nextTimestamp) {
    nextTimestamp = Date.now() + licenseCheckPeriod;
    void Prefs.set("premium_license_nextcheck", nextTimestamp);
  }

  // We cannot use scheduled-event-emitter to schedule delayed intervals, or
  // for rescheduling an event when it is emitted.
  // https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/issues/1227
  licenseCheckTimeoutId = self.setTimeout(() => {
    void checkLicense();
    scheduleNextLicenseCheck(null);
  }, nextTimestamp - Date.now());
}

/**
 * Initializes license checks
 */
function initializeLicenseChecks(): void {
  void scheduledEmitter.setListener(licenseCheckRetryEventName, (info) => {
    void checkLicense(info.callCount);
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
  port.on("premium.activate", async (msg: Message) => {
    if (!isPremiumActivateOptions(msg)) {
      return false;
    }

    if (!msg.userId) {
      return false;
    }

    // The Premium license doesn't contain the Premium user ID,
    // so we need to store it separately for the time being
    void Prefs.set("premium_user_id", msg.userId);
    await checkLicense();

    return true;
  });

  port.on("premium.get", () => getPremiumState());

  installHandler(
    "premium",
    "changed",
    (emit: EventEmitterCallback<PremiumState>) => {
      const onChanged = (): void => {
        emit(getPremiumState());
      };
      emitter.on("activated", onChanged);
      emitter.on("deactivated", onChanged);
      return () => {
        emitter.off("activated", onChanged);
        emitter.off("deactivated", onChanged);
      };
    }
  );

  addTrustedMessageTypes(Prefs.get("premium_license_activation_origin"), [
    "premium.activate"
  ]);
}

/**
 * Initializes Premium license and license checks
 */
export function start(): void {
  initializeMessaging();
  initializeLicenseChecks();
}
