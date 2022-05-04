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
const GeneralPage = require("../page-objects/general.page");
const AdvancedPage = require("../page-objects/advanced.page");
const AcceptableAdsDialogChunk =
  require("../page-objects/acceptableAdsDialog.chunk");

describe("test options page general tab acceptable ads", function()
{
  this.retries(globalRetriesNumber);

  beforeEach(async function()
  {
    await beforeSequence();
  });

  afterEach(async function()
  {
    await afterSequence();
  });

  it("should display AA default state", async function()
  {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isAllowAcceptableAdsCheckboxSelected()).to.be.true;
    expect(await generalPage.
      isOnlyAllowAdsWithoutTrackingCheckboxSelected(true)).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingFLDisplayed()).to.be.true;
  });

  it("should only allow ads without third-party tracking", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickOnlyAllowAdsWithoutTrackingCheckbox();
    if (await generalPage.
      isOnlyAllowAdsWithoutTrackingCheckboxSelected() == false)
    {
      await generalPage.clickOnlyAllowAdsWithoutTrackingCheckbox();
    }
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

  it("should disable allow acceptable ads", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickAllowAcceptableAdsCheckbox();
    if (await generalPage.isAllowAcceptableAdsCheckboxSelected(true) == false)
    {
      await generalPage.clickAllowAcceptableAdsCheckbox();
    }
    expect(await generalPage.
      isAllowAcceptableAdsCheckboxSelected(true)).to.be.true;
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
