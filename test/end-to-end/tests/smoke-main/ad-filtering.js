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

const {randomIntFromInterval, switchToABPOptionsTab, isFirefox,
       waitForCondition} = require("../../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../../page-objects/advanced.page");
const AllowlistedWebsitesPage =
  require("../../page-objects/allowlistedWebsites.page");
const GeneralPage = require("../../page-objects/general.page");
const TestPages = require("../../page-objects/testPages.page");
const {sitekey} = require("../../test-data/data-smoke-tests");
const testData = require("../../test-data/data-smoke-tests");

async function getTestpagesFilters()
{
  const generalPage = new GeneralPage(browser);
  await browser.waitUntil(() => generalPage.isElementDisplayed("pre"));

  const filters = [];
  for await (const filter of $$("pre"))
  {
    filters.push(await filter.getText());
  }

  if (filters.length == 0)
    throw new Error("No filters were found on the page");

  return filters.join("\n");
}

async function addFiltersToABP(filters)
{
  const error = await browser.executeAsync(async(filtersToAdd, callback) =>
  {
    const [errors] = await browser.runtime.sendMessage(
      {type: "filters.importRaw", text: filtersToAdd}
    );
    if (typeof errors != "undefined" && errors[0])
      callback(errors[0]);

    callback();
  }, filters);

  if (error)
    throw new Error(error);
}

function removeAllFiltersFromABP()
{
  return browser.executeAsync(async callback =>
  {
    const filters = await browser.runtime.sendMessage({type: "filters.get"});
    await Promise.all(filters.map(filter => browser.runtime.sendMessage(
      {type: "filters.remove", text: filter.text}
    )));

    callback();
  });
}

module.exports = function()
{
  let optionsUrl;

  before(function()
  {
    ({optionsUrl} = this.test.parent.parent);
  });

  it("uses sitekey to allowlist content", async function()
  {
    if (process.env.MANIFEST_VERSION === "3")
      this.skip();

    await browser.newWindow(sitekey.url);
    const generalPage = new GeneralPage(browser);
    await generalPage.switchToTab(sitekey.title, 8000);
    const filters = await getTestpagesFilters();

    await switchToABPOptionsTab();
    await addFiltersToABP(filters);

    await generalPage.switchToTab(sitekey.title);
    await browser.refresh();
    await browser.waitUntil(async() =>
    {
      return await generalPage.isElementDisplayed(
        "#sitekey-fail-1", false, 200) == false;
    });
    expect(await generalPage.isElementDisplayed(
      "#sitekey-fail-2", false, 100)).to.be.false;
    expect(await generalPage.isElementDisplayed(
      "#sitekey-area > div.testcase-examplecontent")).to.be.true;

    await browser.switchToFrame(await $("#sitekey-frame"));
    expect(await generalPage.isElementDisplayed("#inframe-target")).to.be.true;
    expect(await generalPage.isElementDisplayed("#inframe-image")).to.be.true;
    await browser.closeWindow();

    await switchToABPOptionsTab();
    await removeAllFiltersFromABP();
  });

  it("blocks and hides ads", async function()
  {
    await browser.newWindow(testData.blockHideUrl);
    const generalPage = new GeneralPage(browser);
    await generalPage.switchToTab(testData.blockHideUrl);
    const testPages = new TestPages(browser);
    await waitForCondition("getAwe2FilterText", testPages, 15000, true,
                           randomIntFromInterval(500, 1500),
                           "awe2.js was blocked");
    expect(await testPages.getBanneradsFilterText()).to.include(
      "bannerads/* was blocked");
    expect(await testPages.isSearchAdDivDisplayed()).to.be.false;
    expect(await testPages.isAdContainerDivDisplayed()).to.be.false;
    await browser.closeWindow();
  });

  it("uses snippets to blocks ads", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await switchToABPOptionsTab();
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "adblockinc.gitlab.io#$#hide-if-contains 'should be hidden' p[id]");
    await advancedPage.clickAddCustomFilterListButton();
    await browser.newWindow(testData.snippetsPageUrl);
    const testPages = new TestPages(browser);
    expect(await testPages.isSnippetFilterDivDisplayed()).to.be.false;
    expect(await testPages.isHiddenBySnippetTextDisplayed()).to.be.false;
    await browser.closeWindow();
  });

  it("allowlists websites", async function()
  {
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await switchToABPOptionsTab();
    await allowistedWebsitesPage.init();
    await allowistedWebsitesPage.
      setAllowlistingTextboxValue("https://adblockinc.gitlab.io/");
    expect(await allowistedWebsitesPage.isAddWebsiteButtonEnabled()).to.be.true;
    await allowistedWebsitesPage.clickAddWebsiteButton();
    await browser.newWindow(testData.allowlistingUrl);
    const testPages = new TestPages(browser);
    if (isFirefox())
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
    if (isFirefox())
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
    expect(await testPages.isSnippetFilterDivDisplayed()).to.be.false;
    expect(await testPages.isHiddenBySnippetTextDisplayed()).to.be.false;
  });

  it("displays acceptable ads", async function()
  {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.isAllowAcceptableAdsCheckboxSelected()).to.be.true;
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

    await switchToABPOptionsTab({optionsUrl});
    await generalPage.init();
    await generalPage.clickAllowAcceptableAdsCheckbox();
    await browser.newWindow(ecosiaSearchUrl);
    await testPages.switchToTab(/ecosia/);
    await browser.refresh();
    await browser.pause(randomIntFromInterval(1500, 2500));
    expect(await testPages.isEcosiaAdPillDisplayed(true)).to.be.true;
  });
};
