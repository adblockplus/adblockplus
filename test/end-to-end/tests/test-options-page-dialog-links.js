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

const {afterSequence, beforeSequence, globalRetriesNumber, isChrome, isFirefox,
       isEdge, switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const FooterChunk = require("../page-objects/footer.chunk");
const AboutDialogChunk = require("../page-objects/aboutDialog.chunk");
const AcceptableAdsDialogChunk =
  require("../page-objects/acceptableAdsDialog.chunk");
const HeartDialogChunk = require("../page-objects/heartDialog.chunk");
const GeneralPage = require("../page-objects/general.page");
const dataLinks = require("../test-data/data-links");
let lastTest = false;

describe("test options page dialog links", function()
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
      await switchToABPOptionsTab({switchToFrame: false});
      await browser.refresh();
      await afterSequence();
    }
  });

  it("should open privacy policy page", async function()
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickAboutABPLink();
    const aboutDialogChunk = new AboutDialogChunk(browser);
    await aboutDialogChunk.clickPrivacyPolicyLink();
    await aboutDialogChunk.switchToPrivacyPolicyTab();
    expect(await aboutDialogChunk.getCurrentUrl()).to.include(
      dataLinks.privacyPolicyUrl);
  });

  it("should open imprint page", async function()
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickAboutABPLink();
    const aboutDialogChunk = new AboutDialogChunk(browser);
    await aboutDialogChunk.clickEyeoGmbhLink();
    await aboutDialogChunk.switchToImprintTab();
    expect(await aboutDialogChunk.getCurrentUrl()).to.include(
      dataLinks.imprintUrl);
  });

  it("should open webstore page", async function()
  {
    if (isEdge())
      this.skip();

    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickHeartButton();
    const heartDialogChunk = new HeartDialogChunk(browser);
    await heartDialogChunk.clickRateUsButton();
    if (isFirefox())
    {
      await heartDialogChunk.switchToAddonsTab();
      expect(await heartDialogChunk.getCurrentUrl()).to.match(
        dataLinks.addonsUrl);
    }
    else if (isChrome())
    {
      await heartDialogChunk.switchToChromeWebstoreTab();
      // Cookies agreement page was removed by Chrome.
      // Keeping this functionality here in case it changes back.
      // await browser.keys("Tab");
      // await browser.keys("Tab");
      // await browser.keys("Tab");
      // await browser.keys("Tab");
      // await browser.keys("Enter");
      expect(await heartDialogChunk.getCurrentUrl()).to.include(
        dataLinks.webstoreUrl);
    }
  });

  it("should open donate page", async function()
  {
    if (isEdge())
      this.skip();

    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickHeartButton();
    const heartDialogChunk = new HeartDialogChunk(browser);
    await heartDialogChunk.clickDonateButton();
    await heartDialogChunk.switchToDonateTab();
    expect(await heartDialogChunk.getCurrentUrl()).to.equal(
      dataLinks.donateUrl);
  });

  it("should open aa survey page", async function()
  {
    lastTest = true;
    const generalPage = new GeneralPage(browser);
    await generalPage.clickAllowAcceptableAdsCheckbox();
    if (await generalPage.isAllowAcceptableAdsCheckboxSelected())
    {
      await generalPage.clickAllowAcceptableAdsCheckbox();
    }
    const acceptableAdsDialogChunk = new AcceptableAdsDialogChunk(browser);
    await acceptableAdsDialogChunk.clickGoToSurveyButton();
    await acceptableAdsDialogChunk.switchToAASurveyTab();
    expect(await acceptableAdsDialogChunk.getCurrentUrl()).to.equal(
      dataLinks.aaSurveyUrl);
  });
});
