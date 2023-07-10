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

const {beforeSequence, globalRetriesNumber} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const ExtensionsPage = require("../page-objects/extensions.page");
const GeneralPage = require("../page-objects/general.page");

describe("test abp premium downgrade", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should downgrade premium user", async function()
  {
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
    while (waitTime <= 150000)
    {
      await browser.refresh();
      if ((await generalPage.isPremiumButtonDisplayed()) == true)
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
    expect(await generalPage.isPremiumButtonDisplayed()).to.be.true;
    await browser.executeAsync(async(done) =>
    {
      try
      {
        const response = await browser.runtime.sendMessage({
          type: "premium.activate", userId: "expired_user_id"});
        done(response);
      }
      catch (error)
      {
        done(error);
      }
    });
    expect(await generalPage.isUpgradeButtonDisplayed(10000)).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumDistractionControlFLDisplayed(true)).to.be.true;
    const extensionsPage = new ExtensionsPage(browser);
    await extensionsPage.init();
    await extensionsPage.clickReloadHelperExtensionButton();
    await extensionsPage.switchToABPOptionsTab();
    expect(await generalPage.isUpgradeButtonDisplayed(10000)).to.be.true;
  });
});
