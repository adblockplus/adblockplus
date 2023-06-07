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
       randomIntFromInterval} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const AllowlistedWebsitesPage =
  require("../page-objects/allowlistedWebsites.page");
const GeneralPage = require("../page-objects/general.page");
const ExtensionsPage = require("../page-objects/extensions.page");
const GooglePage = require("../page-objects/google.page");
const TestPages = require("../page-objects/testPages.page");
const siteKeyData = require("../test-data/data-smoke-tests").siteKeyData;
const testData = require("../test-data/data-smoke-tests");
let lastTest = false;

describe("test adblocking as part of the smoke tests", function()
{
  this.retries(globalRetriesNumber + 1);

  before(async function()
  {
    lastTest = false;
    await beforeSequence();
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await afterSequence();
    }
  });

  it("should display acceptable ads", async function()
  {
    const googlePage = new GooglePage(browser);
    await googlePage.init();
    try
    {
      await googlePage.clickAcceptAllButton();
    }
    catch (Exception) {}
    try
    {
      await googlePage.searchForText("hotels");
    }
    catch (Exception)
    {
      await googlePage.switchToTab("Google");
      await browser.refresh();
      await googlePage.init();
      await googlePage.searchForText("hotels");
    }
    try
    {
      expect(await googlePage.isAdTagDisplayed()).to.be.true;
    }
    catch (Exception)
    {
      expect(await googlePage.isSponsoredTagDisplayed()).to.be.true;
    }
    const extensionsPage = new ExtensionsPage(browser);
    await extensionsPage.init();
    await extensionsPage.clickReloadHelperExtensionButton();
    await extensionsPage.switchToABPOptionsTab();
    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    await generalPage.clickAllowAcceptableAdsCheckbox();
    await googlePage.init();
    await googlePage.searchForText("hotels");
    await browser.pause(randomIntFromInterval(1500, 2500));
    expect(await googlePage.isAdTagDisplayed(true)).to.be.true;
  });

  siteKeyData.forEach(async(dataSet) =>
  {
    if ((dataSet.website == "http://trucking.com" &&
        browser.capabilities.browserName == "firefox") ||
        (dataSet.website == "http://cook.com" &&
        browser.capabilities.browserName == "chrome") ||
        (dataSet.website == "http://zins.de" &&
        browser.capabilities.browserName == "msedge"))
    {
      it("should test sitekey: " + dataSet.website, async function()
      {
        await browser.newWindow(dataSet.website);
        const generalPage = new GeneralPage(browser);
        if (browser.capabilities.browserName == "msedge")
        {
          try
          {
            expect(await generalPage.isElementDisplayed(
              dataSet.relatedLinksSelector)).to.be.true;
          }
          catch (Exception)
          {
            await browser.pause(randomIntFromInterval(2500, 3500));
            await browser.refresh();
            await browser.pause(randomIntFromInterval(1500, 2500));
            expect(await generalPage.isElementDisplayed(
              dataSet.relatedLinksSelector)).to.be.true;
          }
        }
        await browser.pause(randomIntFromInterval(1500, 2500));
        await browser.refresh();
        if (browser.capabilities.browserName == "msedge")
        {
          try
          {
            expect(await generalPage.isElementDisplayed(
              dataSet.relatedLinksSelector)).to.be.true;
          }
          catch (Exception)
          {
            await browser.pause(randomIntFromInterval(2500, 3500));
            await browser.refresh();
            await browser.pause(randomIntFromInterval(1500, 2500));
            expect(await generalPage.isElementDisplayed(
              dataSet.relatedLinksSelector)).to.be.true;
          }
        }
        else
        {
          expect(await generalPage.isElementDisplayed(
            dataSet.relatedLinksSelector)).to.be.true;
        }
        await generalPage.switchToABPOptionsTab();
        await generalPage.clickAllowAcceptableAdsCheckbox();
        await generalPage.switchToTab(dataSet.tabTitle);
        await browser.pause(randomIntFromInterval(1500, 2500));
        await browser.refresh();
        expect(await generalPage.isElementDisplayed(
          dataSet.relatedLinksSelector, true)).to.be.true;
        await generalPage.switchToABPOptionsTab();
        await generalPage.clickAllowAcceptableAdsCheckbox();
        await generalPage.switchToTab(dataSet.tabTitle);
        await browser.pause(randomIntFromInterval(1500, 2500));
        await browser.refresh();
        expect(await generalPage.isElementDisplayed(
          dataSet.relatedLinksSelector)).to.be.true;
      });
    }
  }, 2);

  it("should block and hide ads", async function()
  {
    await browser.url(testData.blockHideUrl);
    const testPages = new TestPages(browser);
    expect(await testPages.getAwe2FilterText()).to.include(
      "awe2.js was blocked");
    expect(await testPages.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked");
    expect(await testPages.
      isSearchAdDivDisplayed()).to.be.false;
    expect(await testPages.
      isZergmodDivDisplayed()).to.be.false;
  });

  it("should block ad by snippet", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "adblockinc.gitlab.io#$#hide-if-contains 'should be hidden' p[id]");
    await advancedPage.clickAddCustomFilterListButton();
    await browser.newWindow(testData.snippetsPageUrl);
    const testPages = new TestPages(browser);
    expect(await testPages.
      isSnippetFilterDivDisplayed()).to.be.false;
    expect(await testPages.
      isHiddenBySnippetTextDisplayed()).to.be.false;
  });

  it("should allowlist websites", async function()
  {
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.switchToABPOptionsTab();
    await allowistedWebsitesPage.init();
    await allowistedWebsitesPage.
      setAllowlistingTextboxValue("https://adblockinc.gitlab.io/");
    expect(await allowistedWebsitesPage.
      isAddWebsiteButtonEnabled()).to.be.true;
    await allowistedWebsitesPage.clickAddWebsiteButton();
    await browser.newWindow(testData.allowlistingUrl);
    const testPages = new TestPages(browser);
    if (browser.capabilities.browserName == "firefox")
    {
      if (await allowistedWebsitesPage.getCurrentTitle() !=
        "Blocking and hiding")
      {
        await allowistedWebsitesPage.switchToTab("Blocking and hiding");
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
    await allowistedWebsitesPage.switchToABPOptionsTab();
    await allowistedWebsitesPage.
      removeAllowlistedDomain("adblockinc.gitlab.io");
    const attributesOfAllowlistingTableItems = await
    allowistedWebsitesPage.getAttributeOfAllowlistingTableItems("class");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.equal("empty-placeholder");
    });
    await browser.newWindow(testData.allowlistingUrl);
    await browser.refresh();
    if (browser.capabilities.browserName == "firefox")
    {
      if (await allowistedWebsitesPage.getCurrentTitle() !=
        "Blocking and hiding")
      {
        await allowistedWebsitesPage.switchToTab("Blocking and hiding");
        await browser.refresh();
      }
    }
    lastTest = true;
    expect(await testPages.getAwe2FilterText()).to.include(
      "awe2.js was blocked");
    expect(await testPages.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked");
    expect(await testPages.
      isSnippetFilterDivDisplayed()).to.be.false;
    expect(await testPages.
      isHiddenBySnippetTextDisplayed()).to.be.false;
  });
});
