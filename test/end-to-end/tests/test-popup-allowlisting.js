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

const {beforeSequence, getTabId, switchToABPOptionsTab, waitForCondition} =
        require("../helpers");
const {expect} = require("chai");
const PopupPage = require("../page-objects/popup.page");
const TestPage = require("../page-objects/testPages.page");
const AllowlistedWebsitesPage =
  require("../page-objects/allowlistedWebsites.page");
const testData = require("../test-data/data-smoke-tests");
let globalOrigin;

describe("test popup allowlisting", function()
{
  before(async function()
  {
    globalOrigin = await beforeSequence();
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
       isZergmodDivDisplayed()).to.be.false;
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    await popupPage.clickThisDomainToggle();
    expect(await popupPage.waitUntilDomainToggleActive()).to.be.true;
    await popupPage.clickRefreshButton();
    await testPage.switchToTab("Blocking and hiding");
    await waitForCondition("getAwe2FilterText", 3000, testPage, true, 200,
                           "awe2.js blocking filter should block this");
    expect(await testPage.getAwe2FilterText()).to.include(
      "awe2.js blocking filter should block this");
    expect(await testPage.getBanneradsFilterText()).to.include(
      "first bannerads/* blocking filter should block this");
    expect(await testPage.getSearchAdDivText()).to.include(
      "search-ad id hiding filter should hide this");
    expect(await testPage.getZergmodDivText()).to.include(
      "zergmod class hiding filter should hide this");
    await switchToABPOptionsTab(true);
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    let attributesOfAllowlistingTableItems = await
    allowistedWebsitesPage.getAttributeOfAllowlistingTableItems("class");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.equal("adblockinc.gitlab.io");
    });
    await testPage.switchToTab("Blocking and hiding");
    await popupPage.init(globalOrigin, tabId);
    await popupPage.clickThisDomainToggle();
    expect(await popupPage.waitUntilDomainToggleActive(true)).to.be.true;
    await popupPage.clickRefreshButton();
    await testPage.switchToTab("Blocking and hiding");
    expect(await testPage.getAwe2FilterText()).to.include(
      "awe2.js was blocked");
    expect(await testPage.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked");
    expect(await testPage.
       isSearchAdDivDisplayed()).to.be.false;
    expect(await testPage.
       isZergmodDivDisplayed()).to.be.false;
    await switchToABPOptionsTab(true);
    await allowistedWebsitesPage.init();
    attributesOfAllowlistingTableItems = await
    allowistedWebsitesPage.getAttributeOfAllowlistingTableItems("class");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.equal("empty-placeholder");
    });
  });
});
