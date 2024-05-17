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

const {afterSequence, beforeSequence,
       globalRetriesNumber} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const GeneralPage = require("../page-objects/general.page");
let lastTest = false;

describe("test advanced tab - filter lists", function()
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
    // Wait for 1 minute, for the Last Updated text to say "minutes ago"
    await browser.pause(61000);
    await browser.refresh();
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      waitForAbpFiltersFLLastUpdatedTextToEqual("minutes ago")).to.be.true;
    expect(await advancedPage.
      waitForEasyListFLLastUpdatedTextToEqual("minutes ago")).to.be.true;
    expect(await advancedPage.
      waitForAllowNonintrusiveFLLastUpdatedTextToEqual("minutes ago")).
      to.be.true;
    await advancedPage.clickUpdateAllFilterlistsButton();
    expect(await advancedPage.
      waitForAbpFiltersFLLastUpdatedTextToEqual("Just now")).to.be.true;
    expect(await advancedPage.
      waitForEasyListFLLastUpdatedTextToEqual("Just now")).to.be.true;
    expect(await advancedPage.
      waitForAllowNonintrusiveFLLastUpdatedTextToEqual("Just now")).to.be.true;
  });

  it("should update a filter list", async function()
  {
    // Wait for 1 minute, for the Last Updated text to say "minutes ago"
    await browser.pause(61000);
    await browser.refresh();
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLGearIcon();
    await advancedPage.clickEasyListFLUpdateNowButton();
    expect(await advancedPage.
      waitForEasyListFLLastUpdatedTextToEqual("Just now")).to.be.true;
    expect(await advancedPage.
      waitForAbpFiltersFLLastUpdatedTextToEqual("minutes ago")).to.be.true;
    expect(await advancedPage.
      waitForAllowNonintrusiveFLLastUpdatedTextToEqual("minutes ago")).
      to.be.true;
  });

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
    let easylistSourcePage = "https://easylist-downloads.adblockplus.org/easylist.txt";
    if (process.env.MANIFEST_VERSION == 3)
      easylistSourcePage = "https://easylist-downloads.adblockplus.org/v3/full/easylist.txt";
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLGearIcon();
    await advancedPage.clickEasyListFLSourceButton();
    await advancedPage.switchToEasylistSourceTab();
    expect(await advancedPage.getCurrentUrl()).to.equal(easylistSourcePage);
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
  });

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
    if (process.env.MANIFEST_VERSION == 3)
      console.warn("Test skipped for MV3.");
    else
    {
      const advancedPage = new AdvancedPage(browser);
      await advancedPage.init();
      await advancedPage.clickAddNewFilterListButton();
      expect(await advancedPage.
        isAddNewFilterListDialogDisplayed()).to.be.true;
      if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
      {
        await advancedPage.
        typeTextToFilterListUrlInput("https://test-filterlist.txt", true);
      }
      else
      {
        await advancedPage.
          typeTextToFilterListUrlInput("https://test-filterlist.txt");
      }
      await advancedPage.clickAddAFilterListButton();
      expect(await advancedPage.
        isAddNewFilterListDialogDisplayed(true)).to.be.true;
      expect(await advancedPage.
        isTestFilterListDisplayed()).to.be.true;
      expect(await advancedPage.
        isTestFilterListStatusToggleSelected()).to.be.true;
    }
  });

  it("should display an error for invalid filter list via URL", async function()
  {
    if (process.env.MANIFEST_VERSION == 3)
      console.warn("Test skipped for MV3.");
    else
    {
      const advancedPage = new AdvancedPage(browser);
      await advancedPage.init();
      await advancedPage.clickAddNewFilterListButton();
      expect(await advancedPage.
        isAddNewFilterListDialogDisplayed()).to.be.true;
      if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
      {
        await advancedPage.
        typeTextToFilterListUrlInput("test-filterlist.txt", true);
      }
      else
      {
        await advancedPage.
          typeTextToFilterListUrlInput("test-filterlist.txt");
      }
      await advancedPage.clickAddAFilterListButton();
      expect(await advancedPage.
        isUrlErrorMessageDisplayed()).to.be.true;
      await advancedPage.clickCancelAddingFLButton();
      expect(await advancedPage.
        isTestFilterListNoHtttpsDisplayed()).to.be.false;
    }
  });

  it("should display disabled filters error", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      await advancedPage.typeTextToAddCustomFilterListInput(
        "expres.cz##.barMan", true);
    }
    else
    {
      await advancedPage.typeTextToAddCustomFilterListInput(
        "expres.cz##.barMan");
    }
    await advancedPage.clickAddCustomFilterListButton();
    await advancedPage.clickCustomFilterListsFirstItemToggle();
    expect(await advancedPage.
      isAbpFiltersFLErrorIconDisplayed()).to.be.true;
    await advancedPage.clickAbpFiltersFLErrorIcon();
    expect(await advancedPage.getFilterListErrorTooltipText()).to.equal(
      "There are one or more issues with this filter list:" +
      "Some filters in this filter list are disabled.\n" +
      "Enable them");
    await advancedPage.clickEnableThemButton();
    lastTest = true;
    expect(await advancedPage.
      isFilterListErrorTooltipDisplayed(true)).to.be.true;
    expect(await advancedPage.
      isAbpTestFilterErrorIconDisplayed(true)).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsFirstItemToggleSelected()).to.be.true;
  });
});
