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
const AdvancedPage = require("../page-objects/advanced.page");
const PopupPage = require("../page-objects/popup.page");
let globalOrigin;
let lastTest = false;

describe("test extension as part of the smoke tests", function()
{
  this.retries(globalRetriesNumber + 1);

  before(async function()
  {
    globalOrigin = await beforeSequence();
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await afterSequence();
    }
  });

  it("should display total ad block count", async function()
  {
    if (browser.capabilities.browserName != "firefox")
    {
      const url = "https://adblockinc.gitlab.io/QA-team/adblocking/adblocked-count/adblocked-count-testpage.html";
      const popupPage = new PopupPage(browser);
      const maxAdsBlocked = 10;

      await browser.newWindow(url);
      await popupPage.init(globalOrigin);
      const blockedFirst = await popupPage.waitForNumberOfAdsBlockedToBeInRange(
        0, maxAdsBlocked);

      await browser.url(url);
      await popupPage.init(globalOrigin);
      await popupPage.waitForNumberOfAdsBlockedToBeInRange(
        blockedFirst, maxAdsBlocked);
    }
  });

  it("should reinitialize", async function()
  {
    lastTest = true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickAbpFiltersFLTrashButton();
    await advancedPage.clickEasyListFLTrashButton();
    await advancedPage.clickAllowNonintrusiveAdvertisingFLTrashButton();
    expect(await advancedPage.getFlTableEmptyPlaceholderText()).to.equal(
      "You have not added any filter lists to Adblock Plus. Filter lists " +
      "you add will be shown here.");
    await browser.executeScript("browser.runtime.reload();", []);
    // Switch to tab since browser context was lost after reload
    await browser.switchWindow("Adblock Plus has been installed");
    await browser.url(`${globalOrigin}/options.html`);
    await switchToABPOptionsTab();
    await advancedPage.init();
    expect(await advancedPage.
      isAbpFiltersFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isEasyListFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingFLDisplayed()).to.be.true;
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin);
    expect(String(await popupPage.
      getNotificationMessageText()).includes("An issue has caused your ABP " +
      "settings to be reset to default. Fix the issue and " +
      "learn more")).to.be.true;
    await popupPage.clickLinkInNotificationMessage();
    await popupPage.switchToProblemPageTab();
    expect(String(await popupPage.
      getCurrentUrl()).includes(`${globalOrigin}/problem.html`)).to.be.true;
  });
});
