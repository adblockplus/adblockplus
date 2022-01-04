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

describe("test options page dialogs", () =>
{
  beforeEach(async() =>
  {
    const [origin] = await waitForExtension();
    await browser.url(`${origin}/desktop-options.html`);
  });

  it("should display copyright and version number", async() =>
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickAboutABPLink();
    const aboutDialogChunk = new AboutDialogChunk(browser);
    expect(await aboutDialogChunk.getCopyrightText()).to.match(
      /Copyright © 20\d\d/);
    await aboutDialogChunk.clickCloseButton();
    expect(await aboutDialogChunk.isDialogDisplayed()).to.be.false;
  });

  it("should contain donate and rate us button", async() =>
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickHeartButton();
    const heartDialogChunk = new HeartDialogChunk(browser);
    expect(await heartDialogChunk.isDonateButtonDisplayed()).to.be.true;
    expect(await heartDialogChunk.isRateUsButtonDisplayed()).to.be.true;
    await footerChunk.clickHeartButton();
    expect(await heartDialogChunk.isDonateButtonDisplayed()).to.be.false;
    expect(await heartDialogChunk.isRateUsButtonDisplayed()).to.be.false;
  });

  it("should contain go to survey and no thanks button", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickAllowAcceptableAdsCheckbox();
    const acceptableAdsDialogChunk = new AcceptableAdsDialogChunk(browser);
    expect(await acceptableAdsDialogChunk.isGoToSurveyButtonDisplayed())
      .to.be.true;
    expect(await acceptableAdsDialogChunk.isNoThanksButtonDisplayed())
      .to.be.true;
    await acceptableAdsDialogChunk.clickNoThanksButton();
    expect(await acceptableAdsDialogChunk.isAADialogDisplayed()).to.be.false;
  });
});
