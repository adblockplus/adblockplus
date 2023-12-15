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

const {afterSequence, beforeSequence, globalRetriesNumber,
       switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const GeneralPage = require("../page-objects/general.page");
const testData = require("../test-data/data-smoke-tests");
let lastTest = false;

describe("test installation as part of the smoke tests", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await afterSequence();
    }
  });

  it("should install extension", async function()
  {
    const generalPage = new GeneralPage(browser);
    const appVersion = await browser.
      executeScript("return browser.runtime.getManifest().version;", []);
    await generalPage.switchToInstalledTab();
    let currentUrl = await generalPage.getCurrentUrl();
    try
    {
      expect(currentUrl).to.have.string(
        "adblockplus.org/en/installed");
    }
    catch (Exception)
    {
      await browser.pause(1000);
      currentUrl = await generalPage.getCurrentUrl();
      expect(currentUrl).to.have.string(
        "adblockplus.org/en/installed");
    }
    const browserCapabilities = await browser.capabilities;
    let majorBrowserVersion = (JSON.stringify(browserCapabilities)).
      match(testData.regexMajorBrowserVersion)[0];
    expect(majorBrowserVersion).to.equal(
      currentUrl.match(testData.regex_apv)[0]);
    if (browser.capabilities.browserName == "firefox")
    {
      const navigatorText = await browser.
        executeScript("return navigator.userAgent;", []);
      majorBrowserVersion = navigatorText.
        match(testData.regexMajorBrowserVersionFF)[0];
      expect(majorBrowserVersion).to.equal(
        currentUrl.match(testData.regex_pv)[0]);
    }
    else
    {
      expect(majorBrowserVersion).to.equal(
        currentUrl.match(testData.regex_pv)[0]);
    }
    expect(appVersion).to.equal(currentUrl.match(testData.regex_av)[0]);
    if (browser.capabilities.browserName == "chrome")
    {
      expect("adblockpluschrome").to.
        equal(currentUrl.match(testData.regex_an)[0]);
      expect("chrome").to.
        equal(currentUrl.match(testData.regex_ap)[0]);
      expect("chromium").to.
        equal(currentUrl.match(testData.regex_p)[0]);
    }
    else if (browser.capabilities.browserName == "msedge")
    {
      expect("adblockpluschrome").to.
        equal(currentUrl.match(testData.regex_an)[0]);
      expect("edge").to.
        equal(currentUrl.match(testData.regex_ap)[0]);
      expect("chromium").to.
        equal(currentUrl.match(testData.regex_p)[0]);
    }
    else if (browser.capabilities.browserName == "firefox")
    {
      expect("adblockplusfirefox").to.
        equal(currentUrl.match(testData.regex_an)[0]);
      expect("firefox").to.
        equal(currentUrl.match(testData.regex_ap)[0]);
      expect("gecko").to.
        equal(currentUrl.match(testData.regex_p)[0]);
    }
    else
    {
      throw new Error("Browser name not recognized!");
    }
  });

  it("should uninstall extension", async function()
  {
    const generalPage = new GeneralPage(browser);
    let appVersion = "";
    try
    {
      appVersion = await browser.
        executeScript("return browser.runtime.getManifest().version;", []);
    }
    catch (Exception)
    {
      // Sometimes the browser object takes some time to get initialized
      await browser.pause(4000);
      await switchToABPOptionsTab();
      appVersion = await browser.
        executeScript("return browser.runtime.getManifest().version;", []);
    }
    await browser.executeScript("browser.management.uninstallSelf();", []);
    await generalPage.switchToUninstalledTab();
    const currentUrl = await generalPage.getCurrentUrl();
    expect(currentUrl).to.have.string(
      "https://adblockplus.org/en/uninstalled");
    const browserCapabilities = await browser.capabilities;
    let majorBrowserVersion = (JSON.stringify(browserCapabilities)).
      match(testData.regexMajorBrowserVersion)[0];
    expect(majorBrowserVersion).to.equal(
      currentUrl.match(testData.regex_apv)[0]);
    if (browser.capabilities.browserName == "firefox")
    {
      const navigatorText = await browser.
        executeScript("return navigator.userAgent;", []);
      majorBrowserVersion = navigatorText.
        match(testData.regexMajorBrowserVersionFF)[0];
      expect(majorBrowserVersion).to.equal(
        currentUrl.match(testData.regex_pv)[0]);
    }
    else
    {
      expect(majorBrowserVersion).to.equal(
        currentUrl.match(testData.regex_pv)[0]);
    }
    expect(appVersion).to.equal(currentUrl.match(testData.regex_av)[0]);
    lastTest = true;
    if (browser.capabilities.browserName == "chrome")
    {
      expect("adblockpluschrome").to.
        equal(currentUrl.match(testData.regex_an)[0]);
      expect("chrome").to.
        equal(currentUrl.match(testData.regex_ap)[0]);
      expect("chromium").to.
        equal(currentUrl.match(testData.regex_p)[0]);
    }
    else if (browser.capabilities.browserName == "msedge")
    {
      expect("adblockpluschrome").to.
        equal(currentUrl.match(testData.regex_an)[0]);
      expect("edge").to.
        equal(currentUrl.match(testData.regex_ap)[0]);
      expect("chromium").to.
        equal(currentUrl.match(testData.regex_p)[0]);
    }
    else if (browser.capabilities.browserName == "firefox")
    {
      expect("adblockplusfirefox").to.
        equal(currentUrl.match(testData.regex_an)[0]);
      expect("firefox").to.
        equal(currentUrl.match(testData.regex_ap)[0]);
      expect("gecko").to.
        equal(currentUrl.match(testData.regex_p)[0]);
    }
    else
    {
      throw new Error("Browser name not recognized!");
    }
  });
});
