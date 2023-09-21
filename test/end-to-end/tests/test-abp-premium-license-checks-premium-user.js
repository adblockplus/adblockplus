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

const {beforeSequence, globalRetriesNumber,
       enablePremiumByUI} = require("../helpers");
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

  it("should display active license status for premium user", async function()
  {
    await enablePremiumByUI();
    const premiumHeaderChunk = new PremiumHeaderChunk(browser);
    expect(await premiumHeaderChunk.isPremiumButtonDisplayed()).to.be.true;
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
      to.match(/status.*:.*active/);
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
    const dateOfTomorrow = new Date(new Date().
      setDate(new Date().getDate() + 1)).toLocaleDateString("en-CA");
    let timeNow = new Date();
    timeNow = `${timeNow.getHours()}}`;
    expect(nextLicenseCheckFullDate.
      toLocaleDateString("en-CA").toString()).to.include(dateOfTomorrow);
    const nextLicenseCheckTime = `${nextLicenseCheckFullDate.getHours()}}`;
    expect(nextLicenseCheckTime).to.include(timeNow);
    const extensionsPage = new ExtensionsPage(browser);
    await extensionsPage.init();
    await extensionsPage.clickReloadHelperExtensionButton();
    await extensionsPage.switchToABPOptionsTab();
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
