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
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  type ErrorEvent as SentryErrorEvent,
  Scope
} from "@sentry/browser";
import { getUUID } from "../../id/shared/uuid";
import { info } from "../../info/background/info";
import { Prefs } from "../../../adblockpluschrome/lib/prefs";

export const SENTRY_USER_ID = "sentry_user_id";

let scope: Scope;
/**
 * Report error to Sentry
 *
 * @param error - Error to report
 */
export function reportError(error: Error): void {
  if (scope) {
    scope.captureException(error);
  }
}

let lastEvent: SentryErrorEvent;

/**
 * Get last sent event
 *
 * Note: it's meant to be used for testing purpose only,
 *       use `start()` for production code.
 *
 * @returns The last sent event
 */
export function getLastEvent(): SentryErrorEvent | undefined {
  return lastEvent;
}

/**
 * Initialize Sentry
 *
 * Note: it's meant to be used for testing purpose only,
 *       use `start()` for production code.
 *
 * @param dsn - Sentry DSN
 * @param environment - Sentry environment
 * @param userId - Sentry user id
 */
export async function initialize(
  dsn: string,
  environment: string,
  userId?: string,
  sampleRate?: number
): Promise<void> {
  // filter integrations that use the global variable
  const integrations = getDefaultIntegrations({}).filter(
    (defaultIntegration: { name: string }) => {
      return ![
        "BrowserApiErrors",
        "TryCatch",
        "Breadcrumbs",
        "GlobalHandlers"
      ].includes(defaultIntegration.name);
    }
  );

  const client = new BrowserClient({
    dsn,
    environment,
    release: info.addonVersion,
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    integrations,
    sampleRate: sampleRate ?? 0.01,
    beforeSend(event) {
      console.warn("Event", event);
      lastEvent = event;
      return event;
    }
  });

  scope = new Scope();
  scope.setClient(client);
  client.init();

  self.addEventListener("error", (event) => {
    reportError(event.error);
  });

  await Prefs.untilLoaded;

  if (!userId) {
    userId = Prefs.get(SENTRY_USER_ID);
    if (!userId) {
      userId = getUUID();
      void Prefs.set(SENTRY_USER_ID, userId);
    }
  }

  scope.setUser({
    id: userId
  });

  const premiumUserId = Prefs.get("premium_user_id");
  scope.setExtra("is_premium_user", Boolean(premiumUserId));
}

/**
 * Initialize and start error reporting
 */
export function start(): void {
  if (
    webpackDotenvPlugin.ADBLOCKPLUS_SENTRY_DSN != null &&
    webpackDotenvPlugin.ADBLOCKPLUS_SENTRY_ENVIRONMENT != null
  ) {
    void initialize(
      webpackDotenvPlugin.ADBLOCKPLUS_SENTRY_DSN,
      webpackDotenvPlugin.ADBLOCKPLUS_SENTRY_ENVIRONMENT
    );
  } else {
    console.warn(
      "Sentry is not initialized. " +
        "Pass `ADBLOCKPLUS_SENTRY_DSN` and `ADBLOCKPLUS_SENTRY_ENVIRONMENT` " +
        "in .env file or env. variables, see README file"
    );
  }
}
