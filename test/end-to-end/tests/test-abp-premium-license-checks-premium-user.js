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
       randomIntFromInterval} = require("../helpers");
const {expect} = require("chai");
const ExtensionsPage = require("../page-objects/extensions.page");
const GeneralPage = require("../page-objects/general.page");
const PremiumPage = require("../page-objects/premium.page");
const StripeCheckoutPage = require("../page-objects/stripeCheckout.page");

describe("test abp premium license checks", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should display active license status for premium user", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickUpgradeButton();
    await generalPage.switchToTab(
      "Adblock Plus Premium | The world's #1 ad blocker");
    const currentUrl = await generalPage.getCurrentUrl();
    await browser.url(currentUrl + "?testmode");
    const premiumPage = new PremiumPage(browser);
    await premiumPage.clickGetPremiumMonthlyButton();
    await premiumPage.clickPayWithCreditCardButton();
    const stripeCheckoutPage = new StripeCheckoutPage();
    await stripeCheckoutPage.init();
    await stripeCheckoutPage.typeTextToEmailField("test_automation" +
      randomIntFromInterval(1000000, 9999999).toString() + "@adblock.org");
    await stripeCheckoutPage.typeTextToCardNumberField("4242424242424242");
    await stripeCheckoutPage.typeTextToCardExpiryField("0528");
    await stripeCheckoutPage.typeTextToCardCvcField("295");
    await stripeCheckoutPage.typeTextToNameOnCardField("Test Automation");
    await stripeCheckoutPage.typeTextToZIPField("10001");
    await stripeCheckoutPage.clickSubscribeButton();
    expect(await premiumPage.getPaymentConfirmedLabelText()).to.include(
      "Payment Confirmed!");
    await premiumPage.switchToABPOptionsTab();
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
