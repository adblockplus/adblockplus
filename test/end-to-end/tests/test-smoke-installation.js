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

const fs = require("fs");
const {afterSequence, beforeSequence, globalRetriesNumber} =
  require("../helpers");
const {expect} = require("chai");
const GeneralPage = require("../page-objects/general.page");
const testData = require("../test-data/data-smoke-tests");

describe("test installation as part of the smoke tests", function()
{
  this.retries(globalRetriesNumber);

  beforeEach(async function()
  {
    await beforeSequence();
  });

  afterEach(async function()
  {
    await afterSequence();
  });

  it("should install extension", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.switchToInstalledTab();
    const currentUrl = await generalPage.getCurrentUrl();
    expect(currentUrl).to.have.string(
      "https://welcome.adblockplus.org/en/installed");
    const browserCapabilities = await browser.capabilities;
    const majorBrowserVersion = (JSON.stringify(browserCapabilities)).
      match(testData.regexMajorBrowserVersion)[0];
    expect(majorBrowserVersion).to.equal(
      currentUrl.match(testData.regex_apv)[0]);
    expect(majorBrowserVersion).to.equal(
      currentUrl.match(testData.regex_pv)[0]);
    const manifestContents = fs.readFileSync("../../adblockpluschrome/" +
      "devenv.chrome/manifest.json").toString();
    expect(manifestContents.match(testData.regexManifestVersion)[0]).to.
      equal(currentUrl.match(testData.regex_av)[0]);
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
    await browser.executeScript("browser.management.uninstallSelf();", []);
    const generalPage = new GeneralPage(browser);
    await generalPage.switchToUninstalledTab();
    const currentUrl = await generalPage.getCurrentUrl();
    expect(currentUrl).to.have.string(
      "https://adblockplus.org/en/uninstalled");
    const browserCapabilities = await browser.capabilities;
    const majorBrowserVersion = (JSON.stringify(browserCapabilities)).
      match(testData.regexMajorBrowserVersion)[0];
    expect(majorBrowserVersion).to.equal(
      currentUrl.match(testData.regex_apv)[0]);
    expect(majorBrowserVersion).to.equal(
      currentUrl.match(testData.regex_pv)[0]);
    const manifestContents = fs.readFileSync("../../adblockpluschrome/" +
      "devenv.chrome/manifest.json").toString();
    expect(manifestContents.match(testData.regexManifestVersion)[0]).to.
      equal(currentUrl.match(testData.regex_av)[0]);
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
