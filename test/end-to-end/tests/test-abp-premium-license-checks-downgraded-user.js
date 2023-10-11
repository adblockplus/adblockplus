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

const {beforeSequence, enablePremiumByMockServer,
       globalRetriesNumber, switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const ExtensionsPage = require("../page-objects/extensions.page");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");

describe("test abp premium license checks", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should display expired license for downgraded user", async function()
  {
    await enablePremiumByMockServer();
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
    const premiumHeaderChunk = new PremiumHeaderChunk(browser);
    expect(await premiumHeaderChunk.isUpgradeButtonDisplayed(10000)).to.be.true;
    const nextLicenseCheck = await browser.executeScript(`
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "prefs.get",
        key: "premium_license_nextcheck" }, response => {
        if (browser.runtime.lastError) {
          reject(browser.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
    `, []);
    const nextLicenseCheckFullDate = new Date(nextLicenseCheck);
    expect(nextLicenseCheckFullDate.toISOString()).
      to.equal("1970-01-01T00:00:00.000Z");
    const licenseStatusText = await browser.executeScript(`
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: "prefs.get",
          key: "premium_license"}, response => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `, []);
    expect(JSON.stringify(licenseStatusText)).
      to.match(/status.*:.*expired/);
    const extensionsPage = new ExtensionsPage(browser);
    await extensionsPage.init();
    await extensionsPage.clickReloadHelperExtensionButton();
    await switchToABPOptionsTab();
    const secondNextLicenseCheck = await browser.executeScript(`
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "prefs.get",
          key: "premium_license_nextcheck" }, response => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `, []);
    expect(secondNextLicenseCheck).to.equal(nextLicenseCheck);
  });
});
