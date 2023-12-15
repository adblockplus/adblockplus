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

const {afterSequence, beforeSequence, enablePremiumByUI, globalRetriesNumber,
       switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const AllowlistedWebsitesPage =
  require("../page-objects/allowlistedWebsites.page");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");
const OneClickAllowAdsTestPage =
  require("../page-objects/oneClickAllowAdsTest.page");
let lastTest = false;

describe.skip("test one click allow for premium users", function()
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

  it("should remove web-allowlisted filters for premium users", async function()
  {
    const oneClickAllowAdsTestPage = new OneClickAllowAdsTestPage(browser);
    await oneClickAllowAdsTestPage.init();
    await oneClickAllowAdsTestPage.clickOneClickButton();
    await switchToABPOptionsTab(true);
    const allowListedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowListedWebsitesPage.init();
    await allowListedWebsitesPage.
      setAllowlistingTextboxValue("code.getadblock.com/");
    await allowListedWebsitesPage.clickAddWebsiteButton();
    let attributesOfAllowlistingTableItems = await
    allowListedWebsitesPage.
      getAttributeOfAllowlistingTableItems("aria-label");
    expect(attributesOfAllowlistingTableItems).
      to.contain("code.getadblock.com");
    expect(attributesOfAllowlistingTableItems).
      to.contain("fconeclick.blogspot.com");
    await enablePremiumByUI();
    attributesOfAllowlistingTableItems = await
    allowListedWebsitesPage.
      getAttributeOfAllowlistingTableItems("aria-label");
    expect(attributesOfAllowlistingTableItems).
      to.contain("code.getadblock.com");
    expect(attributesOfAllowlistingTableItems).
      to.not.contain("fconeclick.blogspot.com");
    await oneClickAllowAdsTestPage.init();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed(true)).to.be.true;
  });

  it("should bypass Anti-adblock wall for premium users", async function()
  {
    const premiumHeaderChunk = new PremiumHeaderChunk(browser);
    await switchToABPOptionsTab(true);
    if (!await premiumHeaderChunk.isPremiumButtonDisplayed())
    {
      await enablePremiumByUI();
    }
    const oneClickAllowAdsTestPage = new OneClickAllowAdsTestPage(browser);
    await oneClickAllowAdsTestPage.visitNoSubdomainUrl();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed(true)).to.be.true;
    await oneClickAllowAdsTestPage.visitWWWSubdomainUrl();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed(true)).to.be.true;
    await oneClickAllowAdsTestPage.visitNonWWWSubdomainUrl();
    expect(await oneClickAllowAdsTestPage.
      isOneClickGFCPaywallDisplayed(true)).to.be.true;
    lastTest = true;
  });
});
