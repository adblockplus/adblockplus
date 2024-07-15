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

"use strict";

const {afterSequence, beforeSequence, switchToABPOptionsTab, getTabId, isChrome,
       isFirefox, isEdge} = require("../helpers");
const {expect} = require("chai");
const GeneralPage = require("../page-objects/general.page");
const PopupPage = require("../page-objects/popup.page");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");
const linksFreeUsers =
  require("../test-data/data-premium-links").linksFreeUsers;
let appVersion;
let globalOrigin;
let lastTest = false;

describe("test premium links for free users", function()
{
  before(async function()
  {
    ({origin: globalOrigin} = await beforeSequence());
    appVersion = await browser.
      executeScript("return browser.runtime.getManifest().version;", []);
    await browser.newWindow("https://example.com");
    await switchToABPOptionsTab();
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await browser.closeWindow();
      await afterSequence();
    }
  });

  linksFreeUsers.forEach(async(dataSet) =>
  {
    it("should open link: " + dataSet.testName, async function()
    {
      if (dataSet.testName == "Popup - Upgrade button")
      {
        lastTest = true;
      }
      let page;
      if (dataSet.page == "Options")
      {
        page = new GeneralPage(browser);
        await page.init();
      }
      else if (dataSet.page == "Header")
      {
        page = new PremiumHeaderChunk(browser);
      }
      else
      {
        page = new PopupPage(browser);
        await page.switchToTab("Example Domain");
        const tabId = await getTabId({title: "Example Domain"});
        await page.init(globalOrigin, tabId);
      }
      await dataSet.clickOnLink(page);
      await page.switchToTab(
        "accounts.adblockplus.org");
      const currentUrl = await page.getCurrentUrl();
      expect(currentUrl).to.match(
        /https:\/\/accounts\.adblockplus\.org\/en.*\/premium/);
      const url = new URL(currentUrl);
      const params = url.searchParams;
      expect(params.get("av")).to.equal(appVersion);
      let majorBrowserVersion = (JSON.stringify(browser.capabilities)).
        match(/(?<=browserVersion":").*?(?=\.)/)[0];
      expect(params.get("s")).to.equal(dataSet.source);
      if (isChrome())
      {
        expect(params.get("an")).to.equal("adblockpluschrome");
        expect(params.get("ap")).to.equal("chrome");
        expect(params.get("pv").match(/\d*/)[0]).
          to.equal(majorBrowserVersion);
        expect(params.get("p")).to.equal("chromium");
      }
      else if (isFirefox())
      {
        expect(params.get("an")).to.equal("adblockplusfirefox");
        expect(params.get("ap")).to.equal("firefox");
        const navigatorText = await browser.
          executeScript("return navigator.userAgent;", []);
        majorBrowserVersion = navigatorText.
          match(/(?<=rv:)\d+/)[0];
        expect(params.get("pv").match(/\d*/)[0]).to.equal(majorBrowserVersion);
        expect(params.get("p")).to.equal("gecko");
      }
      else if (isEdge())
      {
        expect(params.get("an")).to.equal("adblockpluschrome");
        expect(params.get("ap")).to.equal("edge");
        expect(params.get("pv").match(/\d*/)[0]).to.equal(majorBrowserVersion);
        expect(params.get("p")).to.equal("chromium");
      }
    });
  });
});
