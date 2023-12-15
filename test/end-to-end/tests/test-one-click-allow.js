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
const OneClickAllowAdsTestPage =
  require("../page-objects/oneClickAllowAdsTest.page");
const AllowlistedWebsitesPage =
  require("../page-objects/allowlistedWebsites.page");
let lastTest = false;

describe.skip("test one click allow", function()
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

  it("should dismiss 1-click allow popup", async function()
  {
    const oneClickAllowAdsTestPage = new OneClickAllowAdsTestPage(browser);
    await oneClickAllowAdsTestPage.init();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed()).to.be.true;
    await oneClickAllowAdsTestPage.clickDismissPaywallX();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed(true)).to.be.true;
    await switchToABPOptionsTab(true);
    const allowlistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowlistedWebsitesPage.init();
    const attributesOfAllowlistingTableItems = await allowlistedWebsitesPage.
      getAttributeOfAllowlistingTableItems("class");
    attributesOfAllowlistingTableItems.
      forEach(async(element) =>
      {
        expect(element).to.equal("empty-placeholder");
      });
  });

  it("should one click allowlist on a domain", async function()
  {
    const oneClickAllowAdsTestPage = new OneClickAllowAdsTestPage(browser);
    await oneClickAllowAdsTestPage.init();
    await browser.refresh();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed()).to.be.true;
    await oneClickAllowAdsTestPage.clickOneClickButton();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed(true)).to.be.true;
    await switchToABPOptionsTab(true);
    const allowListedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowListedWebsitesPage.init();
    const allowListedTableItemWithFCOneClick = await
    allowListedWebsitesPage.
      getAttributeOfAllowlistingTableItems("aria-label");
    allowListedTableItemWithFCOneClick.forEach(async(element) =>
    {
      expect(element).to.contain("fconeclick.blogspot.com");
    });
    // clean up AllowListed Table
    const domainName = "fconeclick.blogspot.com";
    await allowListedWebsitesPage.removeAllowlistedDomain(domainName);
  });

  it("should one click allowlist on a page", async function()
  {
    const oneClickAllowAdsTestPage = new OneClickAllowAdsTestPage(browser);
    await oneClickAllowAdsTestPage.visitOneClickSubPage();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed()).to.be.true;
    await oneClickAllowAdsTestPage.clickOneClickButton();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed(true)).to.be.true;
    await oneClickAllowAdsTestPage.init();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed(true)).to.be.true;
    await switchToABPOptionsTab(true);
    const allowListedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowListedWebsitesPage.init();
    const attributesOfAllowlistingTableItems = await
    allowListedWebsitesPage.
      getAttributeOfAllowlistingTableItems("aria-label");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.contain("fconeclick.blogspot.com");
    });
    // clean up AllowListed Table
    const domainName = "fconeclick.blogspot.com";
    await allowListedWebsitesPage.removeAllowlistedDomain(domainName);
  });

  it("shouldn't display 1-click allow popup with AA on", async function()
  {
    const oneClickAllowAdsTestPage = new OneClickAllowAdsTestPage(browser);
    await oneClickAllowAdsTestPage.visitOneClickAAPage();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed(true)).to.be.true;
  });

  it("should add 1-click allow site to allowlisted websites", async function()
  {
    await switchToABPOptionsTab(true);
    const allowListedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowListedWebsitesPage.init();
    await allowListedWebsitesPage.
      setAllowlistingTextboxValue("fconeclick.blogspot.com");
    await allowListedWebsitesPage.clickAddWebsiteButton();
    const attributesOfAllowlistingTableItems = await
    allowListedWebsitesPage.
      getAttributeOfAllowlistingTableItems("aria-label");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.contain("fconeclick.blogspot.com");
    });
    const oneClickAllowAdsTestPage = new OneClickAllowAdsTestPage(browser);
    await oneClickAllowAdsTestPage.init();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed(true)).to.be.true;
    lastTest = true;
  });
});
