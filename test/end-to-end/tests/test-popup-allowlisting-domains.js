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
       waitForCondition, doesTabExist, isFirefox} = require("../helpers");
const {expect} = require("chai");
const PopupPage = require("../page-objects/popup.page");
const TestPage = require("../page-objects/testPages.page");
const AllowlistedWebsitesPage =
  require("../page-objects/allowlistedWebsites.page");
const testData = require("../test-data/data-smoke-tests");
let globalOrigin;
let lastTest = false;

describe("test popup allowlisting and disallowlisting", function()
{
  before(async function()
  {
    ({origin: globalOrigin} = await beforeSequence());
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await afterSequence();
    }
  });

  it("should allow allowlisting from popup", async function()
  {
    const testPage = new TestPage(browser);
    await browser.newWindow(testData.blockHideUrl);
    await testPage.switchToTab("Blocking and hiding");
    const tabId = await getTabId({title: "Blocking and hiding"});
    expect(await testPage.getAwe2FilterText()).to.include(
      "awe2.js was blocked");
    expect(await testPage.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked");
    expect(await testPage.
       isSearchAdDivDisplayed()).to.be.false;
    expect(await testPage.
       isAdContainerDivDisplayed()).to.be.false;
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    await popupPage.clickThisDomainToggle();
    expect(await popupPage.isDomainToggleChecked()).to.be.false;
    await popupPage.clickRefreshButton();

    await switchToABPOptionsTab({switchToFrame: false});
    await testPage.switchToTab("Blocking and hiding");
    await browser.refresh();
    await waitForCondition("getAwe2FilterText", 3000, testPage, true, 200,
                           "awe2.js blocking filter should block this");
    expect(await testPage.getAwe2FilterText()).to.include(
      "awe2.js blocking filter should block this");
    expect(await testPage.getBanneradsFilterText()).to.include(
      "first bannerads/* blocking filter should block this");
    expect(await testPage.getSearchAdDivText()).to.include(
      "search-ad id hiding filter should hide this");
    expect(await testPage.getAdContainerDivText()).to.include(
      "AdContainer class hiding filter should hide this");

    await switchToABPOptionsTab();
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    let attributesOfAllowlistingTableItems = await allowistedWebsitesPage.
        getAttributeOfAllowlistingTableItems("class");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.equal("adblockinc.gitlab.io");
    });
    await testPage.switchToTab("Blocking and hiding");
    await popupPage.init(globalOrigin, tabId);
    await popupPage.clickThisDomainToggle();
    expect(await popupPage.isDomainToggleChecked()).to.be.true;
    await popupPage.clickRefreshButton();
    await testPage.switchToTab("Blocking and hiding");
    await browser.refresh();
    expect(await testPage.getAwe2FilterText()).to.include(
      "awe2.js was blocked");
    expect(await testPage.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked");
    expect(await testPage.
       isSearchAdDivDisplayed()).to.be.false;
    expect(await testPage.
       isAdContainerDivDisplayed()).to.be.false;

    await switchToABPOptionsTab();
    await allowistedWebsitesPage.init();
    attributesOfAllowlistingTableItems = await allowistedWebsitesPage.
        getAttributeOfAllowlistingTableItems("class");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.equal("empty-placeholder");
    });
  });

  it("should disallowlist domains from popup", async function()
  {
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    await allowistedWebsitesPage.
      setAllowlistingTextboxValue("adblockinc.gitlab.io");
    await allowistedWebsitesPage.clickAddWebsiteButton();
    const testPage = new TestPage(browser);
    await browser.newWindow(testData.blockHideUrl);
    await testPage.switchToTab("Blocking and hiding");
    let tabId = await getTabId({title: "Blocking and hiding"});
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    await popupPage.clickThisDomainToggle();
    await popupPage.clickRefreshButton();

    await switchToABPOptionsTab({switchToFrame: false});
    tabId = await getTabId({title: "Blocking and hiding"});
    await popupPage.switchToTab("Blocking and hiding");
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.isDomainToggleChecked()).to.be.true;
    expect(await popupPage.isPageToggleChecked()).to.be.true;
    expect(await popupPage.isPageStatsCounterDisplayed()).to.be.true;
    expect(await popupPage.isBlockSpecificElementButtonDisplayed()).to.be.true;

    await switchToABPOptionsTab();
    await allowistedWebsitesPage.init();
    const attributesOfAllowlistingTableItems = await allowistedWebsitesPage.
        getAttributeOfAllowlistingTableItems("class");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.equal("empty-placeholder");
    });
  });

  it("should allowlist domains from popup", async function()
  {
    lastTest = true;
    const testPage = new TestPage(browser);
    await browser.newWindow(testData.blockHideUrl);
    await testPage.switchToTab("Blocking and hiding");
    let tabId = await getTabId({title: "Blocking and hiding"});
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    const popupUrl = await popupPage.getCurrentUrl();
    await popupPage.clickThisDomainToggle();
    expect(await popupPage.isRefreshButtonDisplayed()).to.be.true;
    expect(await popupPage.isRefreshMessageDisplayed()).to.be.true;
    await popupPage.clickRefreshButton();

    await switchToABPOptionsTab({switchToFrame: false});
    await browser.newWindow(testData.blockHideUrl);
    await testPage.switchToTab("Blocking and hiding");
    // skip for FF, popup.html does not close
    if (!isFirefox())
    {
      expect(await doesTabExist(popupUrl)).to.be.false;
    }
    await waitForCondition("getAwe2FilterText", 3000, testPage, true, 200,
                           "awe2.js blocking filter should block this");
    expect(await testPage.getAwe2FilterText()).to.include(
      "awe2.js blocking filter should block this");
    tabId = await getTabId({title: "Blocking and hiding"});
    await testPage.switchToTab("Blocking and hiding");
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.isDomainToggleChecked()).to.be.false;
    expect(await popupPage.isPageToggleEnabled()).to.be.false;
    expect(await popupPage.isPageStatsCounterDisplayed()).to.be.false;
    expect(await popupPage.isBlockSpecificElementButtonDisplayed()).to.be.false;

    await switchToABPOptionsTab();
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    const attributesOfAllowlistingTableItems = await allowistedWebsitesPage
        .getAttributeOfAllowlistingTableItems("class");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.equal("adblockinc.gitlab.io");
    });
  });
});
