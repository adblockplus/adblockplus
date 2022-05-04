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

const {beforeSequence, globalRetriesNumber} = require("../helpers");
const {expect} = require("chai");
const FooterChunk = require("../page-objects/footer.chunk");
const AboutDialogChunk = require("../page-objects/aboutDialog.chunk");
const AcceptableAdsDialogChunk =
  require("../page-objects/acceptableAdsDialog.chunk");
const HeartDialogChunk = require("../page-objects/heartDialog.chunk");
const GeneralPage = require("../page-objects/general.page");

describe("test options page dialogs", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should display copyright and version number", async function()
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickAboutABPLink();
    const aboutDialogChunk = new AboutDialogChunk(browser);
    expect(await aboutDialogChunk.getCopyrightText()).to.match(
      /Copyright © 20\d\d/);
    await aboutDialogChunk.clickCloseButton();
    expect(await aboutDialogChunk.isDialogDisplayed()).to.be.false;
  });

  it("should contain donate and rate us button", async function()
  {
    if (browser.capabilities.browserName == "msedge")
    {
      console.warn("Test skipped for Edge.");
    }
    else
    {
      const footerChunk = new FooterChunk(browser);
      await footerChunk.clickHeartButton();
      const heartDialogChunk = new HeartDialogChunk(browser);
      expect(await heartDialogChunk.isDonateButtonDisplayed()).to.be.true;
      expect(await heartDialogChunk.isRateUsButtonDisplayed()).to.be.true;
      await footerChunk.clickHeartButton();
      expect(await heartDialogChunk.isDonateButtonDisplayed(true)).to.be.true;
      expect(await heartDialogChunk.isRateUsButtonDisplayed(true)).to.be.true;
    }
  });

  it("should contain go to survey and no thanks button", async function()
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
