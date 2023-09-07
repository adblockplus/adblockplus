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

const {beforeSequence, afterSequence} = require("../helpers");
const {expect} = require("chai");
const BackgroundPage = require("../page-objects/background.page");
const GeneralPage = require("../page-objects/general.page");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");
const serverResponsesData =
  require("../test-data/data-license-server-responses").serverResponsesData;
let globalOrigin;
let lastTest = false;

describe("test abp premium license server responses", function()
{
  before(async function()
  {
    globalOrigin = await beforeSequence();
  });

  afterEach(async function()
  {
    if (lastTest === false)
    {
      await afterSequence();
    }
  });

  serverResponsesData.forEach(async(dataSet) =>
  {
    it("should display response for: " + dataSet.testName, async function()
    {
      if (dataSet.testName == "invalid user id")
      {
        lastTest = true;
      }
      await browser.newWindow("https://qa-mock-licensing-server.glitch.me/");
      const generalPage = new GeneralPage(browser);
      await generalPage.isMockLicensingServerTextDisplayed();
      await generalPage.switchToABPOptionsTab();
      await browser.executeScript(`
        Promise.all([
          new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({type: "prefs.set",
              key: "premium_license_check_url",
              value: "https://qa-mock-licensing-server.glitch.me/"},
              response => {
              if (browser.runtime.lastError) {
                reject(browser.runtime.lastError);
              } else {
                resolve(response);
              }
            });
          }),
          new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({type: "premium.activate",
            userId: "valid_user_id"}, response => {
              if (browser.runtime.lastError) {
                reject(browser.runtime.lastError);
              } else {
                resolve(response);
              }
            });
          })
        ]).then(results => console.log(results));
      `, []);
      let waitTime = 0;
      let licenseStatus = "";
      while (waitTime <= 150000)
      {
        await browser.refresh();
        licenseStatus = await browser.executeScript(`
          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ type: "prefs.get",
              key: "premium_license" }, response => {
              if (browser.runtime.lastError) {
                reject(browser.runtime.lastError);
              } else {
                resolve(response);
              }
            });
          });
        `, []);
        if (licenseStatus.status == "active")
        {
          break;
        }
        else
        {
          await browser.pause(200);
          waitTime += 200;
        }
      }
      if (waitTime >= 150000)
      {
        throw new Error("License is not active!");
      }
      waitTime = 0;
      const premiumHeaderChunk = new PremiumHeaderChunk(browser);
      while (waitTime <= 150000)
      {
        await browser.refresh();
        if ((await premiumHeaderChunk.isPremiumButtonDisplayed()) == true)
        {
          break;
        }
        else
        {
          await browser.pause(200);
          waitTime += 200;
        }
      }
      if (waitTime >= 150000)
      {
        throw new Error("Premium was not enabled!");
      }
      expect(await premiumHeaderChunk.isPremiumButtonDisplayed()).to.be.true;
      const backgroundPage = new BackgroundPage(browser);
      if (browser.capabilities.browserName == "chrome")
      {
        await backgroundPage.init(globalOrigin);
        await backgroundPage.switchToABPOptionsTab();
      }
      await browser.executeScript(dataSet.request, []);
      if (dataSet.premiumStatus == "enabled")
      {
        expect(await premiumHeaderChunk.isPremiumButtonDisplayed()).to.be.true;
      }
      else
      {
        expect(await premiumHeaderChunk.isUpgradeButtonDisplayed(10000)).
          to.be.true;
      }
      if (browser.capabilities.browserName == "chrome")
      {
        await backgroundPage.switchToTab(/_generated_background_page/);
        let consoleLog;
        try
        {
          consoleLog = await browser.getLogs("browser");
          expect(JSON.stringify(consoleLog)).to.match(dataSet.errorId);
        }
        catch
        {
          // Sometimes a pause is needed for the license to become active
          await browser.pause(5000);
          consoleLog = await browser.getLogs("browser");
          expect(JSON.stringify(consoleLog)).to.match(dataSet.errorId);
        }
      }
    });
  });
});
