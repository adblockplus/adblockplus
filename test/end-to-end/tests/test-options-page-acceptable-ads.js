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
const GeneralPage = require("../page-objects/general.page");
const AdvancedPage = require("../page-objects/advanced.page");
const AcceptableAdsDialogChunk =
  require("../page-objects/acceptableAdsDialog.chunk");

describe("test options page general tab acceptable ads", () =>
{
  beforeEach(async() =>
  {
    const [origin] = await waitForExtension();
    await browser.url(`${origin}/desktop-options.html`);
  });

  it("should display AA default state", async() =>
  {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isAllowAcceptableAdsCheckboxSelected()).to.be.true;
    expect(await generalPage.
      isOnlyAllowAdsWithoutTrackingCheckboxSelected()).to.be.false;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingFLDisplayed()).to.be.true;
  });

  it("should only allow ads without third-party tracking", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickOnlyAllowAdsWithoutTrackingCheckbox();
    expect(await generalPage.
      isOnlyAllowAdsWithoutTrackingCheckboxSelected()).to.be.true;
    expect(await generalPage.
      isDoNotTrackNoteParagraphDisplayed()).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingWithoutTrackingFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingFLDisplayed()).to.be.false;
  });

  it("should disable allow acceptable ads", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickAllowAcceptableAdsCheckbox();
    expect(await generalPage.
      isAllowAcceptableAdsCheckboxSelected()).to.be.false;
    const acceptableAdsDialogChunk = new AcceptableAdsDialogChunk(browser);
    expect(await acceptableAdsDialogChunk.isAADialogDisplayed()).to.be.true;
    await acceptableAdsDialogChunk.clickNoThanksButton();
    expect(await acceptableAdsDialogChunk.isAADialogDisplayed()).to.be.false;
    expect(await generalPage.
      isOnlyAllowAdsWithoutTrackingCheckboxEnabled()).to.be.false;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingWithoutTrackingFLDisplayed()).to.be.false;
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingFLDisplayed()).to.be.false;
  });
});
