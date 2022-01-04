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

const {waitForExtension} = require("../helpers");
const {expect} = require("chai");
const FooterChunk = require("../page-objects/footer.chunk");
const GeneralPage = require("../page-objects/general.page");
const AdvancedPage = require("../page-objects/advanced.page");
const HelpPage = require("../page-objects/help.page");
const AllowlistedWebsitesPage =
  require("../page-objects/allowlistedWebsites.page");
const dataLinks = require("../test-data/data-links");

describe("test options page links", () =>
{
  beforeEach(async() =>
  {
    const [origin] = await waitForExtension();
    await browser.url(`${origin}/desktop-options.html`);
  });

  afterEach(async() =>
  {
    await browser.closeWindow();
  });

  it("should open contribute page", async() =>
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickContributeButton();
    await footerChunk.switchToContributeTab();
    expect(await footerChunk.getCurrentUrl()).to.equal(
      dataLinks.contributeUrl);
  });

  it("should open AA criteria page", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    await generalPage.clickAcceptableAdsCriteriaLink();
    await generalPage.switchToAAInfoTab();
    expect(await generalPage.getCurrentUrl()).to.equal(
      dataLinks.aaCriteriaUrl);
  });

  it("should open AA learn more page", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    await generalPage.clickAcceptableAdsLearnMoreLink();
    await generalPage.switchToAAInfoTab();
    expect(await generalPage.getCurrentUrl()).to.equal(
      dataLinks.aaLearnMoreUrl);
  });

  it("should open allowlisting learn more page", async() =>
  {
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    await allowistedWebsitesPage.clickAllowlistingLearnMoreLink();
    await allowistedWebsitesPage.switchToABPFAQTab();
    expect(await allowistedWebsitesPage.getCurrentUrl()).to.equal(
      dataLinks.allowlistingLearnMoreUrl);
  });

  it("should open subscriptions page", async() =>
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickFilterListsLearnMoreLink();
    await advancedPage.switchToSubscriptionsTab();
    expect(await advancedPage.getCurrentUrl()).to.equal(
      dataLinks.subscriptionsUrl);
  });

  it("should open how to write filters page", async() =>
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickLearnHowToWriteFiltersLink();
    await advancedPage.switchToHowToWriteFiltersTab();
    expect(await advancedPage.getCurrentUrl()).to.equal(
      dataLinks.howToWriteFiltersUrl);
  });

  it("should open help center page", async() =>
  {
    const helpPage = new HelpPage(browser);
    await helpPage.init();
    await helpPage.clickVisitOurHelpCenterLink();
    await helpPage.switchToHelpCenterTab();
    expect(await helpPage.getCurrentUrl()).to.equal(
      dataLinks.helpCenterUrl);
  });

  it("should open bug report page", async() =>
  {
    const helpPage = new HelpPage(browser);
    await helpPage.init();
    await helpPage.clickSendUsABugReportLink();
    await helpPage.switchToBugReportTab();
    expect(await helpPage.getCurrentUrl()).to.equal(
      dataLinks.reportAnIssueUrl);
  });

  it("should open forum page", async() =>
  {
    const helpPage = new HelpPage(browser);
    await helpPage.init();
    await helpPage.clickForumLink();
    await helpPage.switchToForumTab();
    expect(await helpPage.getCurrentUrl()).to.equal(
      dataLinks.forumUrl);
  });

  it("should open twitter page", async() =>
  {
    const helpPage = new HelpPage(browser);
    await helpPage.init();
    await helpPage.clickTwitterLink();
    await helpPage.switchToTwitterTab();
    expect(await helpPage.getCurrentUrl()).to.equal(
      dataLinks.twitterUrl);
  });

  it("should open facebook page", async() =>
  {
    const helpPage = new HelpPage(browser);
    await helpPage.init();
    await helpPage.clickFacebookLink();
    await helpPage.switchToFacebookTab();
    expect(await helpPage.getCurrentUrl()).to.equal(
      dataLinks.facebookUrl);
  });
});
