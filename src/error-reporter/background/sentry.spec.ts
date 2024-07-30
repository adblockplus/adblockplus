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

import { Prefs } from "../../../adblockpluschrome/lib/prefs";
import {
  initialize,
  reportError,
  SENTRY_USER_ID,
  getLastEvent
} from "./sentry";

jest.mock("../../../adblockpluschrome/lib/prefs", () => {
  const prefsData: Record<string, any> = {
    sentry_user_id: "" // default (no value)
  };

  return {
    Prefs: {
      ...prefsData,
      get: (key: string) => {
        return prefsData[key];
      },
      set: (key: string, value: any) => {
        prefsData[key] = value;
      },
      untilLoaded: Promise.resolve()
    }
  };
});

describe("Sentry", () => {
  const DSN = "https://1111@o22222.ingest.us.sentry.io/333333333";
  const ENVIRONMENT = "test";

  beforeEach(() => {
    jest.spyOn(global, "fetch").mockImplementation(
      jest.fn(async () => {
        return await Promise.resolve({
          ok: true,
          text: async () => "",
          json: async () => ({})
        });
      }) as jest.Mock
    );
  });

  it("sends a request when bug report requested", async () => {
    void initialize(DSN, ENVIRONMENT, "testSentryUserId", 1);
    const ERR_MESSAGE = "Test error";
    reportError(new Error(ERR_MESSAGE));
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://o22222.ingest.us.sentry.io/api/333333333/envelope/?sentry_key=1111"
      ),
      expect.anything()
    );

    expect(getLastEvent()).toEqual(
      expect.objectContaining({
        environment: ENVIRONMENT,
        release: "10.0.0", // AdblockPlus release
        exception: expect.objectContaining({
          values: [
            expect.objectContaining({
              type: "Error",
              value: ERR_MESSAGE
            })
          ]
        })
      })
    );
  });

  it("generates and persists new Sentry user ID if not saved", async () => {
    expect(Prefs.get(SENTRY_USER_ID)).toHaveLength(0);

    await initialize(DSN, ENVIRONMENT);
    const sentryUserId = Prefs.get(SENTRY_USER_ID);
    expect(sentryUserId).toEqual(expect.any(String));
    expect(sentryUserId.length > 0).toBe(true);
  });

  it("reuses existing Sentry user ID if saved", async () => {
    const SAVED_USER_ID = "testSentryUserId";
    await Prefs.set(SENTRY_USER_ID, SAVED_USER_ID);

    await initialize(DSN, ENVIRONMENT);
    expect(Prefs.get(SENTRY_USER_ID)).toEqual(SAVED_USER_ID);
  });

  it("does not send user email", async () => {
    await Prefs.set("premium_user_id", ""); // default (no value)

    void initialize(DSN, ENVIRONMENT);
    reportError(new Error("Test error"));
    const lastEvent = getLastEvent();
    expect(lastEvent).toBeDefined();
    expect(lastEvent?.user?.email).toBeUndefined();
  });

  it("does not pass premium user ID if not saved", async () => {
    await Prefs.set("premium_user_id", ""); // default (no value)

    void initialize(DSN, ENVIRONMENT);
    reportError(new Error("Test error"));
    const lastEvent = getLastEvent();
    expect(lastEvent).toBeDefined();
    expect(lastEvent?.extra).toBeUndefined();
  });

  it("passes premium status", async () => {
    const PREMIUM_USER_ID = "testPremiumUserId";
    await Prefs.set("premium_user_id", PREMIUM_USER_ID);

    await initialize(DSN, ENVIRONMENT, undefined, 1);
    reportError(new Error("Test error"));
    expect(getLastEvent()).toEqual(
      expect.objectContaining({
        extra: {
          is_premium_user: true
        }
      })
    );
  });
});
