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
const AdvancedPage = require("../page-objects/advanced.page");
const GeneralPage = require("../page-objects/general.page");

describe("test advanced tab - filter lists", function()
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

  it("should display default state", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isAbpFiltersFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isAbpFiltersFLStatusToggleSelected()).to.be.true;
    expect(await advancedPage.
      isEasyListFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isEasyListFLStatusToggleSelected()).to.be.true;
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingFLStatusToggleEnabled()).to.be.false;
  });

  it("should update all filter lists", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickUpdateAllFilterlistsButton();
    advancedPage.clickUpdateAllFilterlistsButton();
    expect(await advancedPage.
      isAbpFiltersFLUpdating()).to.be.true;
    advancedPage.clickUpdateAllFilterlistsButton();
    expect(await advancedPage.
      isEasyListFLUpdating()).to.be.true;
    advancedPage.clickUpdateAllFilterlistsButton();
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingFLUpdating()).to.be.true;
    expect(await advancedPage.
      isAbpFiltersFLUpdatingDone()).to.be.true;
    expect(await advancedPage.
      isEasyListFLUpdatingDone()).to.be.true;
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingFLUpdatingDone()).to.be.true;
    expect(await advancedPage.
      waitForAbpFiltersFLLastUpdatedTextToEqual("Just now")).to.be.true;
    expect(await advancedPage.
      waitForEasyListFLLastUpdatedTextToEqual("Just now")).to.be.true;
    expect(await advancedPage.
      waitForAllowNonintrusiveFLLastUpdatedTextToEqual("Just now")).to.be.true;
  }, 2);

  it("should update a filter list", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLGearIcon();
    await advancedPage.clickEasyListFLUpdateNowButton();
    await advancedPage.clickEasyListFLGearIcon();
    advancedPage.clickEasyListFLUpdateNowButton();
    expect(await advancedPage.
      isEasyListFLUpdating()).to.be.true;
    expect(await advancedPage.
      isAbpFiltersFLUpdating(1000, true)).to.be.true;
    expect(await advancedPage.
      isAllowNonintrusiveAdvertisingFLUpdating(1000, true)).to.be.true;
  }, 3);

  it("should go to filter list web page", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLGearIcon();
    await advancedPage.clickEasyListFLWebsiteButton();
    await advancedPage.switchToEasylisttoTab();
    expect(await advancedPage.getCurrentUrl()).to.equal(
      "https://easylist.to/");
  });

  it("should go to filter list source page", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLGearIcon();
    await advancedPage.clickEasyListFLSourceButton();
    await advancedPage.switchToEasylistSourceTab();
    expect(await advancedPage.getCurrentUrl()).to.equal(
      "https://easylist-downloads.adblockplus.org/easylist.txt");
  });

  it("should disable/enable a filter list", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLStatusToggle();
    expect(await advancedPage.
      isEasyListFLStatusToggleSelected()).to.be.false;
    await advancedPage.clickEasyListFLStatusToggle();
    expect(await advancedPage.
      isEasyListFLStatusToggleSelected()).to.be.true;
  });

  it("should delete a filter list", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLTrashButton();
    expect(await advancedPage.
      isEasyListFLDisplayed()).to.be.false;
    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    expect(await generalPage.getLanguagesTableEmptyPlaceholderText()).to.equal(
      "You don't have any language-specific filters.");
  }, 2);

  it("should add a built-in filter list", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickAddBuiltinFilterListButton();
    expect(await advancedPage.
      isFilterListsDropdownDisplayed()).to.be.true;
    await advancedPage.clickListeFREasyListFL();
    expect(await advancedPage.
      isFilterListsDropdownDisplayed(true)).to.be.true;
    expect(await advancedPage.
      isListeFREasyListFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isListeFREasyListFLStatusToggleSelected()).to.be.true;
    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    expect(await generalPage.
      isListeFRPlusEasylistLanguageTableItemDisplayed()).to.be.true;
  });

  it("should add a filter list via URL", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickAddNewFilterListButton();
    expect(await advancedPage.
      isAddNewFilterListDialogDisplayed()).to.be.true;
    await advancedPage.
      typeTextToFilterListUrlInput("https://test-filterlist.txt");
    await advancedPage.clickAddAFilterListButton();
    expect(await advancedPage.
      isAddNewFilterListDialogDisplayed(true)).to.be.true;
    expect(await advancedPage.
      isTestFilterListDisplayed()).to.be.true;
    expect(await advancedPage.
      isTestFilterListStatusToggleSelected()).to.be.true;
  });

  it("should display an error for invalid filter list via URL", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickAddNewFilterListButton();
    expect(await advancedPage.
      isAddNewFilterListDialogDisplayed()).to.be.true;
    await advancedPage.
      typeTextToFilterListUrlInput("test-filterlist.txt");
    await advancedPage.clickAddAFilterListButton();
    expect(await advancedPage.
      isUrlErrorMessageDisplayed()).to.be.true;
    await advancedPage.clickCancelAddingFLButton();
    expect(await advancedPage.
      isTestFilterListNoHtttpsDisplayed()).to.be.false;
  });

  it("should display disabled filters error", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickAddNewFilterListButton();
    expect(await advancedPage.
      isAddNewFilterListDialogDisplayed()).to.be.true;
    await advancedPage.typeTextToFilterListUrlInput(
      "https://gitlab.com/-/snippets/1997334/raw");
    await advancedPage.clickAddAFilterListButton();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "@@||example.com^$document,subdocument");
    await advancedPage.clickAddCustomFilterListButton();
    await advancedPage.clickCustomFilterListsFirstItemToggle();
    expect(await advancedPage.
      isAbpTestFilterErrorIconDisplayed()).to.be.true;
    await advancedPage.clickAbpTestFilterErrorIcon();
    await advancedPage.clickEnableThemButton();
    expect(await advancedPage.
      isFilterListErrorPopoutDisplayed(true)).to.be.true;
    expect(await advancedPage.
      isAbpTestFilterErrorIconDisplayed(true)).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsFirstItemToggleSelected()).to.be.true;
  }, 3);
});
