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

import assert from "assert";
import * as ewe from "../../../vendor/webext-sdk/dist/ewe-api.js";
import {setUninstallURL} from "../../lib/uninstall.js";
import * as info from "info";

const adSubscriptionUrls = ewe.subscriptions.getRecommendations()
  .filter(recommendation => recommendation.type == "ads")
  .map(recommendation => recommendation.url);
const realSetUninstallURL = browser.runtime.setUninstallURL;

let uninstallURL;
let urlParams = () => new URL(uninstallURL).search.substr(1).split("&");

describe("Uninstall URL", () =>
{
  beforeEach(() =>
  {
    browser.runtime.setUninstallURL = url => uninstallURL = url;
  });
  afterEach(() =>
  {
    browser.runtime.setUninstalLURL = realSetUninstallURL;
  });

  it("adds parameters to uninstall URL", () =>
  {
    const expectedParams = [
      ["an", info.addonName],
      ["av", info.addonVersion],
      ["ap", info.application],
      ["apv", info.applicationVersion],
      ["p", info.platform],
      ["fv", ewe.reporting.getFirstVersion()],
      ["pv", info.platformVersion],
      ["ndc", "0"],
      ["c", "0"],
      ["s", "3"]
    ];
    setUninstallURL();

    let params = urlParams();
    for (let [name, value] of expectedParams)
    {
      value = encodeURIComponent(value);
      assert.ok(
        params.includes(`${name}=${value}`),
        `The parameter '${name}' has the expected value '${value}'`
      );
    }
  });

  it("limits uninstall URL length", () =>
  {
    const maxLength = 255;
    setUninstallURL();
    assert.ok(
      uninstallURL.length <= maxLength,
      `uninstall URL is not longer than ${maxLength} characters`
    );
  });

  describe("Subscription parameter", () =>
  {
    let initialSubscriptions;

    beforeEach(() =>
    {
      browser.runtime.setUninstallURL = url => uninstallURL = url;
      initialSubscriptions = ewe.subscriptions.getDownloadable();
    });
    afterEach(() =>
    {
      for (let subscription of initialSubscriptions)
        ewe.subscriptions.add(subscription.url);
      browser.runtime.setUninstalLURL = realSetUninstallURL;
    });

    it("produces parameter s=0", () =>
    {
      for (let subscription of initialSubscriptions)
        ewe.subscriptions.remove(subscription.url);
      setUninstallURL();
      assert.ok(
        urlParams().includes("s=0"),
        "subscription parameter 's' has the expected value '0'"
      );
    });

    it("produces parameter s=1", () =>
    {
      for (let subscription of initialSubscriptions)
      {
        if (!adSubscriptionUrls.includes(subscription.url))
          ewe.subscriptions.remove(subscription.url);
      }
      setUninstallURL();
      assert.ok(
        urlParams().includes("s=1"),
        "subscription parameter 's' has the expected value '1'" + urlParams()
      );
    });

    it("produces parameter s=2", () =>
    {
      for (let subscription of initialSubscriptions)
      {
        if (subscription.url != ewe.subscriptions.ACCEPTABLE_ADS_URL)
          ewe.subscriptions.remove(subscription.url);
      }
      setUninstallURL();
      assert.ok(
        urlParams().includes("s=2"),
        "subscription parameter 's' has the expected value '2'" + urlParams()
      );
    });
  });
});
