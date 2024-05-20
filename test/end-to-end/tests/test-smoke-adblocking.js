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
       randomIntFromInterval, switchToABPOptionsTab,
       waitForCondition} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const AllowlistedWebsitesPage =
  require("../page-objects/allowlistedWebsites.page");
const GeneralPage = require("../page-objects/general.page");
const ExtensionsPage = require("../page-objects/extensions.page");
const TestPages = require("../page-objects/testPages.page");
const siteKeyData = require("../test-data/data-smoke-tests").siteKeyData;
const testData = require("../test-data/data-smoke-tests");
let lastTest = false;

describe("test adblocking as part of the smoke tests", function()
{
  this.retries(globalRetriesNumber - 1);

  before(async function()
  {
    this.timeout(200000);
    await beforeSequence();
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await afterSequence();
    }
  });

  siteKeyData.forEach(async(dataSet) =>
  {
    // The browser names used here are the ones in test.conf not the runtime
    // names, as the browser object is not properly initalized at this point
    if ((dataSet.website == "http://church.com" &&
        browser.capabilities.browserName.toLowerCase().includes("firefox")) ||
        (dataSet.website == "http://mckowen.com" &&
        browser.capabilities.browserName.toLowerCase().includes("chrome")) ||
        (dataSet.website == "http://zins.de" &&
        browser.capabilities.browserName.toLowerCase().includes("edge")))
    {
      if (process.env.MANIFEST_VERSION == 3)
        console.warn("Test skipped for MV3.");
      else
      {
        it("should test sitekey: " + dataSet.website, async function()
        {
          await browser.newWindow(dataSet.website);
          const generalPage = new GeneralPage(browser);
          if (browser.capabilities.browserName.toLowerCase().includes("edge"))
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
              await browser.refresh();
              expect(await generalPage.isElementDisplayed(
                dataSet.relatedLinksSelector)).to.be.true;
            }
          }
          await browser.pause(randomIntFromInterval(1500, 2500));
          await browser.refresh();
          if (browser.capabilities.browserName.toLowerCase().includes("edge"))
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
          else if (browser.capabilities.browserName.
            toLowerCase().includes("firefox"))
          {
            await browser.switchToFrame(await $("#master-1"));
            expect(await generalPage.isElementDisplayed(
              dataSet.relatedLinksSelector)).to.be.true;
            await browser.switchToParentFrame();
          }
          else
          {
            expect(await generalPage.isElementDisplayed(
              dataSet.relatedLinksSelector)).to.be.true;
          }
          await switchToABPOptionsTab();
          await generalPage.clickAllowAcceptableAdsCheckbox();
          await generalPage.switchToTab(dataSet.tabTitle);
          await browser.pause(randomIntFromInterval(1500, 2500));
          await browser.refresh();
          expect(await generalPage.isElementDisplayed(
            dataSet.relatedLinksSelector, true)).to.be.true;
          await switchToABPOptionsTab();
          await generalPage.clickAllowAcceptableAdsCheckbox();
          await generalPage.switchToTab(dataSet.tabTitle);
          await browser.pause(randomIntFromInterval(1500, 2500));
          await browser.refresh();
          if (!browser.capabilities.browserName.
            toLowerCase().includes("firefox"))
          {
            expect(await generalPage.isElementDisplayed(
              dataSet.relatedLinksSelector)).to.be.true;
          }
          else
          {
            await browser.switchToFrame(await $("#master-1"));
            expect(await generalPage.isElementDisplayed(
              dataSet.relatedLinksSelector)).to.be.true;
            await browser.switchToParentFrame();
          }
          await browser.closeWindow();
        });
      }
    }
  });

  it("should block and hide ads", async function()
  {
    await browser.newWindow(testData.blockHideUrl);
    const testPages = new TestPages(browser);
    await waitForCondition("getAwe2FilterText", testPages, 15000, true,
                           randomIntFromInterval(500, 1500),
                           "awe2.js was blocked");
    expect(await testPages.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked");
    expect(await testPages.
      isSearchAdDivDisplayed()).to.be.false;
    expect(await testPages.
      isAdContainerDivDisplayed()).to.be.false;
    await browser.closeWindow();
  });

  it("should block ad by snippet", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await switchToABPOptionsTab();
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
    await browser.closeWindow();
  });

  it("should allowlist websites", async function()
  {
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await switchToABPOptionsTab();
    await allowistedWebsitesPage.init();
    await allowistedWebsitesPage.
      setAllowlistingTextboxValue("https://adblockinc.gitlab.io/");
    expect(await allowistedWebsitesPage.
      isAddWebsiteButtonEnabled()).to.be.true;
    await allowistedWebsitesPage.clickAddWebsiteButton();
    await browser.newWindow(testData.allowlistingUrl);
    const testPages = new TestPages(browser);
    if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      if (await allowistedWebsitesPage.getCurrentTitle() !=
        "Blocking and hiding")
      {
        await allowistedWebsitesPage.switchToTab(/blocking-hiding-testpage/);
        await browser.pause(2000);
        await browser.refresh();
        await browser.pause(3000);
      }
      await browser.refresh();
    }
    await browser.refresh();
    await allowistedWebsitesPage.switchToTab(/blocking-hiding-testpage/);
    expect(await testPages.getAwe2FilterText()).to.include(
      "awe2.js blocking filter should block this");
    expect(await testPages.getBanneradsFilterText()).to.include(
      "first bannerads/* blocking filter should block this");
    expect(await testPages.getSearchAdDivText()).to.include(
      "search-ad id hiding filter should hide this");
    expect(await testPages.getAdContainerDivText()).to.include(
      "AdContainer class hiding filter should hide this");
    await switchToABPOptionsTab();
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
    if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      if (await allowistedWebsitesPage.getCurrentTitle() !=
        "Blocking and hiding")
      {
        await allowistedWebsitesPage.switchToTab(/blocking-hiding-testpage/);
        await browser.refresh();
      }
    }
    expect(await testPages.getAwe2FilterText()).to.include(
      "awe2.js was blocked");
    expect(await testPages.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked");
    expect(await testPages.
      isSnippetFilterDivDisplayed()).to.be.false;
    expect(await testPages.
      isHiddenBySnippetTextDisplayed()).to.be.false;
  });

  it("should display acceptable ads", async function()
  {
    lastTest = true;
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isAllowAcceptableAdsCheckboxSelected()).to.be.true;
    const testPages = new TestPages(browser);
    const ecosiaSearchUrl =
      "https://www.ecosia.org/search?method=index&q=hotels";
    await browser.newWindow(ecosiaSearchUrl);
    await testPages.switchToTab(/ecosia/);
    await browser.refresh();
    try
    {
      await waitForCondition("isEcosiaAdPillDisplayed", testPages, 25000,
                             true, randomIntFromInterval(1500, 3500));
    }
    catch (Exception)
    {
      await waitForCondition("isEcosiaAdPillAlternateDisplayed", testPages,
                             25000, true, randomIntFromInterval(1500, 3500));
    }
    const extensionsPage = new ExtensionsPage(browser);
    await extensionsPage.init();
    await extensionsPage.clickReloadHelperExtensionButton();
    await browser.pause(randomIntFromInterval(1500, 2500));
    await switchToABPOptionsTab();
    await generalPage.init();
    await generalPage.clickAllowAcceptableAdsCheckbox();
    await browser.newWindow(ecosiaSearchUrl);
    await testPages.switchToTab(/ecosia/);
    await browser.refresh();
    await browser.pause(randomIntFromInterval(1500, 2500));
    expect(await testPages.isEcosiaAdPillDisplayed(true)).to.be.true;
  });
});
