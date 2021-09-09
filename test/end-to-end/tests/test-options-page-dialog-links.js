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
const AboutDialogChunk = require("../page-objects/aboutDialog.chunk");
const AcceptableAdsDialogChunk =
  require("../page-objects/acceptableAdsDialog.chunk");
const HeartDialogChunk = require("../page-objects/heartDialog.chunk");
const GeneralPage = require("../page-objects/general.page");
const WebstoreCookiesAgreementPage =
  require("../page-objects/webstoreCookiesAgreement.external.page");
const dataLinks = require("../test-data/data-links");
let browser = null;

describe("test options page dialog links", () =>
{
  beforeEach(async() =>
  {
    let origin = null;
    [browser, origin] = await waitForExtension();
    await browser.url(`${origin}/desktop-options.html`);
  });

  afterEach(async() =>
  {
    await browser.deleteSession();
  });

  it("should open privacy policy page", async() =>
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickAboutABPLink();
    const aboutDialogChunk = new AboutDialogChunk(browser);
    await aboutDialogChunk.clickPrivacyPolicyLink();
    await aboutDialogChunk.switchToPrivacyPolicyTab();
    expect(await aboutDialogChunk.getCurrentUrl()).to.equal(
      dataLinks.privacyPolicyUrl);
  });

  it("should open imprint page", async() =>
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickAboutABPLink();
    const aboutDialogChunk = new AboutDialogChunk(browser);
    await aboutDialogChunk.clickEyeoGmbhLink();
    await aboutDialogChunk.switchToImprintTab();
    expect(await aboutDialogChunk.getCurrentUrl()).to.equal(
      dataLinks.imprintUrl);
  });

  it("should open webstore page", async() =>
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickHeartButton();
    const heartDialogChunk = new HeartDialogChunk(browser);
    await heartDialogChunk.clickRateUsButton();
    await heartDialogChunk.switchToWebstoreCookiesAgreementTab();
    const webstoreCookiesAgreementPage =
      new WebstoreCookiesAgreementPage(browser);
    await webstoreCookiesAgreementPage.clickIAgreeButton();
    await webstoreCookiesAgreementPage.switchToWebstoreTab();
    expect(await webstoreCookiesAgreementPage.getCurrentUrl()).to.equal(
      dataLinks.webstoreUrl);
  });

  it("should open donate page", async() =>
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickHeartButton();
    const heartDialogChunk = new HeartDialogChunk(browser);
    await heartDialogChunk.clickDonateButton();
    await heartDialogChunk.switchToDonateTab();
    expect(await heartDialogChunk.getCurrentUrl()).to.equal(
      dataLinks.donateUrl);
  });

  it("should open aa survey page", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickAllowAcceptableAdsCheckbox();
    const acceptableAdsDialogChunk = new AcceptableAdsDialogChunk(browser);
    await acceptableAdsDialogChunk.clickGoToSurveyButton();
    await acceptableAdsDialogChunk.switchToAASurveyTab();
    expect(await acceptableAdsDialogChunk.getCurrentUrl()).to.equal(
      dataLinks.aaSurveyUrl);
  });
});
