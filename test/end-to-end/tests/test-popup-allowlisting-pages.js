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

const {beforeSequence, afterSequence, getTabId, switchToABPOptionsTab,
       waitForCondition, doesTabExist} = require("../helpers");
const {expect} = require("chai");
const PopupPage = require("../page-objects/popup.page");
const TestPage = require("../page-objects/testPages.page");
const AllowlistedWebsitesPage =
  require("../page-objects/allowlistedWebsites.page");
const testData = require("../test-data/data-smoke-tests");
let globalOrigin;
let lastTest = false;

describe("test popup allowlisting and disallowlisting pages", function()
{
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

  it("should disallowlist pages from popup", async function()
  {
    const testPage = new TestPage(browser);
    await browser.newWindow(testData.blockHideUrl);
    await testPage.switchToTab("Blocking and hiding");
    const blockingAndHidingUrl = await testPage.getCurrentUrl();
    const tabId = await getTabId({title: "Blocking and hiding"});
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    await popupPage.clickThisPageToggle();
    await popupPage.clickRefreshButton();
    await testPage.switchToTab("Adblock Plus Options");
    await testPage.switchToTab("Blocking and hiding");
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.isDomainToggleChecked()).to.be.true;
    expect(await popupPage.isPageToggleChecked()).to.be.false;
    await popupPage.clickThisPageToggle();
    await popupPage.clickRefreshButton();
    await testPage.switchToTab("Adblock Plus Options");
    await testPage.switchToTab("Blocking and hiding");
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.isDomainToggleChecked()).to.be.true;
    expect(await popupPage.isPageToggleChecked()).to.be.true;
    expect(await popupPage.isPageStatsCounterDisplayed()).to.be.true;
    expect(await popupPage.isBlockSpecificElementButtonDisplayed()).to.be.true;
    await popupPage.switchToTab("Adblock Plus Options");
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    const attributesOfAllowlistingTableItems = await allowistedWebsitesPage
        .getAttributeOfAllowlistingTableItems("class");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.not.equal(blockingAndHidingUrl);
    });
  });

  it("should allowlist pages from popup", async function()
  {
    lastTest = true;
    const testPage = new TestPage(browser);
    await browser.newWindow(testData.blockHideUrl);
    await testPage.switchToTab("Blocking and hiding");
    let tabId = await getTabId({title: "Blocking and hiding"});
    let popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    const popupUrl = await popupPage.getCurrentUrl();
    await popupPage.clickThisPageToggle();
    expect(await popupPage.isRefreshButtonDisplayed()).to.be.true;
    expect(await popupPage.isRefreshMessageDisplayed()).to.be.true;
    await popupPage.clickRefreshButton();
    await switchToABPOptionsTab(true);
    await testPage.switchToTab("Blocking and hiding");
    await browser.refresh();
    await waitForCondition("getAwe2FilterText", 3000, testPage, true, 200,
                           "awe2.js blocking filter should block this");
    expect(await testPage.getAwe2FilterText()).to.include(
      "awe2.js blocking filter should block this");
    // skip for FF, popup.html does not close
    if (browser.capabilities.browserName != "firefox")
    {
      expect(await doesTabExist(popupUrl)).to.be.false;
    }
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.isDomainToggleChecked()).to.be.true;
    expect(await popupPage.isPageToggleChecked()).to.be.false;
    expect(await popupPage.isPageStatsCounterDisplayed()).to.be.false;
    expect(await popupPage.isBlockSpecificElementButtonDisplayed()).to.be.false;
    const adblockedCountUrl = "adblockinc.gitlab.io/QA-team/adblocking/" +
        "adblocked-count/adblocked-count-testpage.html";
    await browser.newWindow(`https://${adblockedCountUrl}`);
    await popupPage.switchToTab("Ad blocked count testpage");
    tabId = await getTabId({title: "Ad blocked count testpage"});
    popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.isDomainToggleChecked()).to.be.true;
    expect(await popupPage.isPageToggleEnabled()).to.be.true;
    await switchToABPOptionsTab(true);
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    const attributesOfAllowlistingTableItems = await allowistedWebsitesPage
        .getAttributeOfAllowlistingTableItems("class");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.equal(adblockedCountUrl);
    });
  });
});
