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
const TestPages = require("../page-objects/testPages.page");
const GeneralPage = require("../page-objects/general.page");

describe("test DC filterlist blocking for premium users", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should block distraction control content", async function()
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
    await browser.newWindow("https://adblockinc.gitlab.io/QA-team/" +
      "adblocking/DC-filters/DC-filters-testpage.html");
    await generalPage.switchToTab("DC filters");
    const testPages = new TestPages(browser);
    expect(await testPages.
      isPushNotificationsHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isPushNotificationsBlockingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isAutoplayVideosHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isAutoplayVideosBlockingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isSurveysHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isSurveysBlockingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isNewsletterPopupsHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isNewsletterPopupsBlockingFilterIdDisplayed()).to.be.false;
  });
});
