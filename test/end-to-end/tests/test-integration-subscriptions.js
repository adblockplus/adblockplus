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
const GeneralPage = require("../page-objects/general.page");
const TestPages = require("../page-objects/testPages.page");
let lastTest = false;

describe("test subscriptions as part of the integration tests", function()
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

  it("should add new subscription via link", async function()
  {
    await browser.url("https://adblockinc.gitlab.io/QA-team/adblocking" +
      "/subscriptions/subscriptions-testpage.html");
    const testPages = new TestPages(browser);
    expect(await testPages.getSubscriptionBlockingText()).to.include(
      "/subscription-blocking.js should be blocked");
    expect(await testPages.getSubscriptionBlockingRegexText()).to.include(
      "/subscription-blocking-regex.js should be blocked");
    expect(await testPages.getSubscriptionHidingIdText()).to.include(
      "id element should be hidden");
    expect(await testPages.getSubscriptionHidingClassText()).to.include(
      "class element should be hidden");
    await testPages.clickSubscribeLink();
    const generalPage = new GeneralPage(browser);
    await switchToABPOptionsTab();
    console.error(String(await generalPage.
      getPredefinedDialogTitleText()));
    expect(String(await generalPage.
      getPredefinedDialogTitleText()).includes("ARE YOU SURE YOU WANT TO ADD" +
      " THIS FILTER LIST?")).to.be.true;
    await generalPage.clickYesUseThisFLButton();
    expect(String(await generalPage.
      getMoreFilterListsTableItemByLabelText("ABP test subscription")).
      includes("ABP test subscription")).to.be.true;
    await browser.newWindow("https://adblockinc.gitlab.io/QA-team/adblocking" +
      "/subscriptions/subscriptions-testpage.html");
    await browser.refresh();
    expect(await testPages.getSubscriptionBlockingText()).to.include(
      "/subscription-blocking.js was blocked");
    expect(await testPages.getSubscriptionBlockingRegexText()).to.include(
      "/subscription-blocking-regex.* was blocked");
    expect(await testPages.
      isSubscriptionHidingIdDisplayed()).to.be.false;
    expect(await testPages.
      isSubscriptionHidingClassDisplayed()).to.be.false;
  });

  it("should disable/enable subscriptions", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLStatusToggle();
    expect(await advancedPage.
      isEasyListFLStatusToggleSelected()).to.be.false;
    await browser.newWindow("https://adblockinc.gitlab.io/QA-team/adblocking/block" +
      "ing-hiding/blocking-hiding-testpage.html");
    if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      await browser.pause(500);
    }
    await browser.refresh();
    const testPages = new TestPages(browser);
    if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      if (await testPages.getCurrentTitle() !=
        "Blocking and hiding")
      {
        await testPages.switchToTab("Blocking and hiding");
        await browser.refresh();
      }
    }
    expect(await testPages.getAwe2FilterText()).to.include(
      "awe2.js blocking filter should block this");
    expect(await testPages.getBanneradsFilterText()).to.include(
      "first bannerads/* blocking filter should block this");
    expect(await testPages.getSearchAdDivText()).to.include(
      "search-ad id hiding filter should hide this");
    expect(await testPages.getZergmodDivText()).to.include(
      "zergmod class hiding filter should hide this");
    await switchToABPOptionsTab();
    await advancedPage.init();
    await advancedPage.clickEasyListFLStatusToggle();
    expect(await advancedPage.
      isEasyListFLStatusToggleSelected()).to.be.true;
    await browser.newWindow("https://adblockinc.gitlab.io/QA-team/adblocking/block" +
      "ing-hiding/blocking-hiding-testpage.html");
    await browser.refresh();
    if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      if (await testPages.getCurrentTitle() !=
        "Blocking and hiding")
      {
        await testPages.switchToTab("Blocking and hiding");
        await browser.refresh();
      }
    }
    expect(await testPages.getAwe2FilterText()).to.include(
      "awe2.js was blocked");
    expect(await testPages.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked");
    expect(await testPages.
      isSearchAdDivDisplayed()).to.be.false;
    expect(await testPages.
      isZergmodDivDisplayed()).to.be.false;
  });

  it("should add/remove subscriptions", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      await browser.refresh();
      await switchToABPOptionsTab();
      await advancedPage.init();
      await advancedPage.clickAddBuiltinFilterListButton();
      await advancedPage.clickEasyListEnglishFL();
      await advancedPage.init();
    }
    else
    {
      await advancedPage.init();
    }
    await advancedPage.clickEasyListFLTrashButton();
    expect(await advancedPage.
      isEasyListFLDisplayed()).to.be.false;
    await browser.newWindow("https://adblockinc.gitlab.io/QA-team/adblocking/block" +
      "ing-hiding/blocking-hiding-testpage.html");
    await browser.refresh();
    const testPages = new TestPages(browser);
    if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      if (await testPages.getCurrentTitle() !=
        "Blocking and hiding")
      {
        await testPages.switchToTab("Blocking and hiding");
        await browser.refresh();
      }
    }
    expect(await testPages.getAwe2FilterText()).to.include(
      "awe2.js blocking filter should block this");
    expect(await testPages.getBanneradsFilterText()).to.include(
      "first bannerads/* blocking filter should block this");
    expect(await testPages.getSearchAdDivText()).to.include(
      "search-ad id hiding filter should hide this");
    expect(await testPages.getZergmodDivText()).to.include(
      "zergmod class hiding filter should hide this");
    await switchToABPOptionsTab();
    await advancedPage.init();
    await advancedPage.clickAddBuiltinFilterListButton();
    await advancedPage.clickEasyListEnglishFL();
    expect(await advancedPage.
      isEasyListFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isEasyListFLStatusToggleSelected()).to.be.true;
    expect(await advancedPage.
      isEasyListFLUpdatingDone()).to.be.true;
    await browser.newWindow("https://adblockinc.gitlab.io/QA-team/adblocking/block" +
      "ing-hiding/blocking-hiding-testpage.html");
    await browser.refresh();
    if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      if (await testPages.getCurrentTitle() !=
        "Blocking and hiding")
      {
        await testPages.switchToTab("Blocking and hiding");
        await browser.refresh();
      }
    }
    lastTest = true;
    expect(await testPages.getAwe2FilterText()).to.include(
      "awe2.js was blocked");
    expect(await testPages.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked");
    expect(await testPages.
      isSearchAdDivDisplayed()).to.be.false;
    expect(await testPages.
      isZergmodDivDisplayed()).to.be.false;
  });
});
