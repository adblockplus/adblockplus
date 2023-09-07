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

const {afterSequence, beforeSequence} =
  require("../helpers");
const {expect} = require("chai");
const GeneralPage = require("../page-objects/general.page");
const PopupPage = require("../page-objects/popup.page");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");
const linksFreeUsers =
  require("../test-data/data-premium-links").linksFreeUsers;
let globalOrigin;
let lastTest = false;

describe("test premium links for free users", function()
{
  before(async function()
  {
    globalOrigin = await beforeSequence();
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      browser.closeWindow();
      await afterSequence();
    }
  });

  linksFreeUsers.forEach(async(dataSet) =>
  {
    it("should display filters errors: " + dataSet.testName, async function()
    {
      if (dataSet.testName == "Popup - Upgrade button")
      {
        lastTest = true;
      }
      const appVersion = await browser.
        executeScript("return browser.runtime.getManifest().version;", []);
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
        await page.init(globalOrigin);
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
      const browserCapabilities = await browser.capabilities;
      let majorBrowserVersion = (JSON.stringify(browserCapabilities)).
        match(/(?<=browserVersion":").*?(?=\.)/)[0];
      expect(params.get("s")).to.equal(dataSet.source);
      if (browser.capabilities.browserName == "chrome")
      {
        expect(params.get("an")).to.equal("adblockpluschrome");
        expect(params.get("ap")).to.equal("chrome");
        expect(params.get("pv").match(/\d*/)[0]).
          to.equal(majorBrowserVersion);
        expect(params.get("p")).to.equal("chromium");
      }
      else if (browser.capabilities.browserName == "firefox")
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
      else if (browser.capabilities.browserName == "MicrosoftEdge")
      {
        expect(params.get("an")).to.equal("adblockpluschrome");
        expect(params.get("ap")).to.equal("edge");
        expect(params.get("pv").match(/\d*/)[0]).to.equal(majorBrowserVersion);
        expect(params.get("p")).to.equal("chromium");
      }
    });
  });
});
