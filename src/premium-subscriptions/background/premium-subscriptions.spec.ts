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

import type * as ewe from "@eyeo/webext-ad-filtering-solution";
import { computePremiumState } from "./premium-subscriptions";

const fixtures: {
  premiumSubscriptions: ewe.Recommendation[];
  activeSubscriptions: ewe.Subscription[];
} = {
  premiumSubscriptions: [
    {
      id: "CDAD4CF5-2706-42CB-B404-F5B9B61B8CAA",
      languages: [],
      title: "Premium - Distraction Control",
      type: "annoyances",
      url: "https://easylist-downloads.adblockplus.org/adblock_premium.txt",
      requires: [],
      includes: []
    },
    {
      id: "588470E8-E163-4CD9-A909-521B2A3BE73F",
      languages: [],
      title: "Premium - Block cookie consent pop-ups",
      type: "cookies-premium",
      url: "https://easylist-downloads.adblockplus.org/cookie-filter-list.txt",
      requires: [],
      includes: []
    }
  ],
  activeSubscriptions: [
    {
      id: "8C13E995-8F06-4927-BEA7-6C845FB7EEBF",
      enabled: true,
      homepage: "https://easylist.to/",
      updatable: true,
      title: "EasyList",
      url: "https://easylist-downloads.adblockplus.org/easylist.txt",
      version: "202405021041",
      downloading: false,
      downloadStatus: "synchronize_ok",
      lastSuccess: 1714646839,
      lastDownload: 1714646839,
      softExpiration: 1714744554,
      expires: 1714819639
    },
    {
      id: "CDAD4CF5-2706-42CB-B404-F5B9B61B8CAA",
      enabled: true,
      homepage: "adblockplus.org",
      updatable: true,
      title: "Premium - Distraction Control",
      url: "https://easylist-downloads.adblockplus.org/adblock_premium.txt",
      version: "202405021041",
      downloading: false,
      downloadStatus: "synchronize_ok",
      lastSuccess: 1714647344,
      lastDownload: 1714647344,
      softExpiration: 1714741250,
      expires: 1714820144
    }
  ]
};

describe("computePremiumState", () => {
  it("returns annoyances: true if the Premium distraction control sub is active", () => {
    expect(fixtures.premiumSubscriptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Premium - Distraction Control"
        })
      ])
    );

    expect(fixtures.activeSubscriptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Premium - Distraction Control",
          enabled: true
        })
      ])
    );

    const result = computePremiumState(
      fixtures.premiumSubscriptions,
      fixtures.activeSubscriptions
    );

    expect(result).toHaveProperty("annoyances", true);
  });

  it("returns cookies-premium: false if the Premium cookie consent sub is not active", () => {
    expect(fixtures.premiumSubscriptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Premium - Block cookie consent pop-ups"
        })
      ])
    );

    expect(fixtures.activeSubscriptions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Premium - Block cookie consent pop-ups"
        })
      ])
    );

    const result = computePremiumState(
      fixtures.premiumSubscriptions,
      fixtures.activeSubscriptions
    );

    expect(result).toHaveProperty("cookies-premium", false);
  });

  it("returns cookies-premium: true if the Premium cookie consent sub is active", () => {
    const fixturesCookiesEnabled = structuredClone(fixtures);
    fixturesCookiesEnabled.activeSubscriptions.push({
      id: "588470E8-E163-4CD9-A909-521B2A3BE73F",
      enabled: true,
      homepage: "adblockplus.org",
      updatable: true,
      title: "Premium - Block cookie consent pop-ups",
      url: "https://easylist-downloads.adblockplus.org/cookie-filter-list.txt",
      version: "202405021041",
      downloading: false,
      downloadStatus: "synchronize_ok",
      lastSuccess: 1714647344,
      lastDownload: 1714647344,
      softExpiration: 1714741250,
      expires: 1714820144
    });

    expect(fixturesCookiesEnabled.premiumSubscriptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Premium - Block cookie consent pop-ups"
        })
      ])
    );

    expect(fixturesCookiesEnabled.activeSubscriptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Premium - Block cookie consent pop-ups",
          enabled: true
        })
      ])
    );

    const result = computePremiumState(
      fixturesCookiesEnabled.premiumSubscriptions,
      fixturesCookiesEnabled.activeSubscriptions
    );

    expect(result).toHaveProperty("cookies-premium", true);
  });

  it("returns false if the premium subscription is present in activeSubscriptions but is disabled", () => {
    const fixturesDisabled = structuredClone(fixtures);
    fixturesDisabled.activeSubscriptions.push({
      id: "588470E8-E163-4CD9-A909-521B2A3BE73F",
      enabled: false,
      homepage: "adblockplus.org",
      updatable: true,
      title: "Premium - Block cookie consent pop-ups",
      url: "https://easylist-downloads.adblockplus.org/cookie-filter-list.txt",
      version: "202405021041",
      downloading: false,
      downloadStatus: "synchronize_ok",
      lastSuccess: 1714647344,
      lastDownload: 1714647344,
      softExpiration: 1714741250,
      expires: 1714820144
    });

    expect(fixturesDisabled.premiumSubscriptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Premium - Block cookie consent pop-ups"
        })
      ])
    );

    expect(fixturesDisabled.activeSubscriptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Premium - Block cookie consent pop-ups",
          enabled: false
        })
      ])
    );

    console.log(fixturesDisabled);

    const result = computePremiumState(
      fixturesDisabled.premiumSubscriptions,
      fixturesDisabled.activeSubscriptions
    );

    expect(result).toHaveProperty("cookies-premium", false);
  });
});
