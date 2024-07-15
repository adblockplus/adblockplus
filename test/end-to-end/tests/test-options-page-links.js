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

const {afterSequence, beforeSequence, globalRetriesNumber} =
  require("../helpers");
const {expect} = require("chai");
const FooterChunk = require("../page-objects/footer.chunk");
const GeneralPage = require("../page-objects/general.page");
const AdvancedPage = require("../page-objects/advanced.page");
const HelpPage = require("../page-objects/help.page");
const AllowlistedWebsitesPage =
  require("../page-objects/allowlistedWebsites.page");
const dataLinks = require("../test-data/data-links");
let lastTest = false;

describe("test options page links", function()
{
  let optionsUrl;

  this.retries(globalRetriesNumber);

  before(async function()
  {
    ({optionsUrl} = await beforeSequence());
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await browser.closeWindow();
      await afterSequence(optionsUrl);
    }
  });

  it("should open contribute page", async function()
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickContributeButton();
    await footerChunk.switchToContributeTab();
    expect(await footerChunk.getCurrentUrl()).to.include(
      dataLinks.contributeUrl);
  });

  it("should open AA criteria page", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    await generalPage.clickAcceptableAdsCriteriaLink();
    await generalPage.switchToAACriteriaTab();
    expect(await generalPage.getCurrentUrl()).to.include(
      dataLinks.aaCriteriaUrl);
  });

  it("should open AA learn more page", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    await generalPage.clickAcceptableAdsLearnMoreLink();
    await generalPage.switchToAAInfoTab();
    expect(await generalPage.getCurrentUrl()).to.include(
      dataLinks.aaLearnMoreUrl);
  });

  it("should open allowlisting learn more page", async function()
  {
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    await allowistedWebsitesPage.clickAllowlistingLearnMoreLink();
    await allowistedWebsitesPage.switchToABPFAQTab();
    expect(await allowistedWebsitesPage.getCurrentUrl()).to.include(
      dataLinks.allowlistingLearnMoreUrl);
  });

  it("should open subscriptions page", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickFilterListsLearnMoreLink();
    await advancedPage.switchToSubscriptionsTab();
    expect(await advancedPage.getCurrentUrl()).to.include(
      dataLinks.subscriptionsUrl);
  });

  it("should open how to write filters page", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickLearnHowToWriteFiltersLink();
    await advancedPage.switchToHowToWriteFiltersTab();
    expect(await advancedPage.getCurrentUrl()).to.include(
      dataLinks.howToWriteFiltersUrl);
  });

  it("should open help center page", async function()
  {
    const helpPage = new HelpPage(browser);
    await helpPage.init();
    await helpPage.clickVisitOurHelpCenterLink();
    await helpPage.switchToHelpCenterTab();
    expect(await helpPage.getCurrentUrl()).to.include(
      dataLinks.helpCenterUrl);
  });

  it("should open bug report page", async function()
  {
    const helpPage = new HelpPage(browser);
    await helpPage.init();
    await helpPage.clickSendUsABugReportLink();
    await helpPage.switchToBugReportTab();
    expect(await helpPage.getCurrentUrl()).to.include(
      dataLinks.reportAnIssueUrl);
  });

  it("should open forum page", async function()
  {
    const helpPage = new HelpPage(browser);
    await helpPage.init();
    await helpPage.clickForumLink();
    if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      await helpPage.switchToForumTabFirefox();
      expect(await helpPage.getCurrentUrl()).to.include(
        dataLinks.forumUrlFirefox);
    }
    else if (browser.capabilities.browserName.toLowerCase().
      includes("chrome") &&
      browser.capabilities.browserName.toLowerCase().includes("edge"))
    {
      await helpPage.switchToForumTabChrome();
      expect(await helpPage.getCurrentUrl()).to.include(
        dataLinks.forumUrlChrome);
    }
  });

  it("should open X page", async function()
  {
    const helpPage = new HelpPage(browser);
    await helpPage.init();
    await helpPage.clickXLink();
    await helpPage.switchToXTab();
    expect(await helpPage.getCurrentUrl()).to.match(
      dataLinks.XUrl);
  });

  it("should open facebook page", async function()
  {
    lastTest = true;
    const helpPage = new HelpPage(browser);
    await helpPage.init();
    await helpPage.clickFacebookLink();
    await helpPage.switchToFacebookTab();
    try
    {
      expect(await helpPage.getCurrentUrl()).to.include(
        dataLinks.facebookUrl);
    }
    catch (Exception)
    {
      expect(await helpPage.getCurrentUrl()).to.include(
        dataLinks.facebookFallbackUrl);
    }
  });
});
