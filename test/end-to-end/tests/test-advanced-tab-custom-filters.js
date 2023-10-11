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

const {afterSequence, beforeSequence, globalRetriesNumber,
       switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const multipleFilters =
  require("../test-data/data-custom-filters").multipleFilters;

describe("test advanced tab custom filters", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  afterEach(async function()
  {
    try
    {
      const advancedPage = new AdvancedPage(browser);
      await advancedPage.init();
      await advancedPage.clickCustomFLTableHeadCheckbox();
      await advancedPage.clickDeleteCustomFLButton();
    }
    catch (Exception) {}
    await afterSequence();
  });

  it("should display default state", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isCustomFilterListsTableDisplayed()).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsTableContentDisplayed()).to.be.false;
    expect(await advancedPage.
      isCopyCustomFLButtonDisplayed()).to.be.false;
    expect(await advancedPage.
      isDeleteCustomFLButtonDisplayed()).to.be.false;
    expect(await advancedPage.
      isAddCustomFilterListButtonEnabled(true)).to.be.true;
  });

  it("should add a custom filter", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "test/filter.png");
    expect(await advancedPage.
      isAddCustomFilterListButtonEnabled()).to.be.true;
    await advancedPage.clickAddCustomFilterListButton();
    expect(await advancedPage.
      isCustomFilterListsTableDisplayed()).to.be.true;
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("test/filter.png")).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsFirstItemToggleSelected()).to.be.true;
  });

  it("should add a slow custom filter", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "slow-filter");
    await advancedPage.clickAddCustomFilterListButton();
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("slow-filter")).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsFirstItemAlertIconDisplayed()).to.be.true;
    await advancedPage.hoverCustomFilterListsFirstItemAlertIcon();
    expect(await advancedPage.
      isCustomFLFirstItemAlertIconTooltipDisplayed()).to.be.true;
  });

  it("should add a comment custom filter", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "!comment");
    await advancedPage.clickAddCustomFilterListButton();
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("!comment")).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsFirstItemToggleDisplayed()).to.be.false;
  });

  it("should add a duplicated custom filter", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "duplicated/filter.png");
    await advancedPage.clickAddCustomFilterListButton();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "duplicated/filter.png");
    expect(await advancedPage.
      isAddCustomFilterListButtonEnabled(true)).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("1")).to.be.true;
  });

  it("should disable/enable a custom filter", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "test/disable-filter.png");
    await advancedPage.clickAddCustomFilterListButton();
    await advancedPage.clickCustomFilterListsFirstItemToggle();
    expect(await advancedPage.
      isCustomFilterListsFirstItemToggleSelected("true")).to.be.true;
    await advancedPage.clickCustomFilterListsFirstItemToggle();
    expect(await advancedPage.
      isCustomFilterListsFirstItemToggleSelected()).to.be.true;
  });

  it("should delete a custom filter", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "test/remove-filter.png");
    await advancedPage.clickAddCustomFilterListButton();
    await advancedPage.clickCustomFilterListsNthItemCheckbox("1");
    await advancedPage.clickDeleteCustomFLButton();
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("test/remove-filter.png")).to.be.false;
  });

  it("should display copy and delete buttons", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "test/filter.png");
    await advancedPage.clickAddCustomFilterListButton();
    expect(await advancedPage.
      isCopyCustomFLButtonDisplayed()).to.be.false;
    expect(await advancedPage.
      isDeleteCustomFLButtonDisplayed()).to.be.false;
    await advancedPage.clickCustomFilterListsNthItemCheckbox("1");
    expect(await advancedPage.
      isCopyCustomFLButtonDisplayed()).to.be.true;
    expect(await advancedPage.
      isDeleteCustomFLButtonDisplayed()).to.be.true;
  });

  it("should support multiline paste", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    const multilineString = `
      [filterlist header]
      ##.hiding_filter
      /blocking/filter/*
      duplicate

      duplicate
      ! comment
    `;
    await advancedPage.typeTextToAddCustomFilterListInput(
      "");
    await browser.executeScript(
      `navigator.clipboard.writeText(\`${multilineString}\`);`, []);
    const platform = await browser.
      executeScript("return navigator.platform", []);
    let pasteKey = "Control";
    if (platform.includes("Mac"))
    {
      pasteKey = "Command";
    }
    await browser.keys([pasteKey, "V"]);
    await advancedPage.
      waitForCustomFilterListsNthItemTextToEqual("##.hiding_filter", "1");
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("##.hiding_filter")).to.be.true;
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("/blocking/filter/*")).to.be.true;
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("duplicate")).to.be.true;
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("! comment")).to.be.true;
  });

  it("should sort custom filters", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "");
    await browser.executeScript(
      `navigator.clipboard.writeText(\`${multipleFilters}\`);`, []);
    const platform = await browser.
      executeScript("return navigator.platform", []);
    let pasteKey = "Control";
    if (platform.includes("Mac"))
    {
      pasteKey = "Command";
    }
    await browser.keys([pasteKey, "V"]);
    await advancedPage.
      waitForCustomFilterListsNthItemTextToEqual("##.hiding_filter", "1");
    await advancedPage.clickCustomFilterListsFirstItemToggle();
    await advancedPage.clickCustomFLTableHeadCheckbox();
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("1")).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("2")).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("3")).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("4")).to.be.true;
    await advancedPage.clickCustomFLTableHeadCheckbox();
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("1", true)).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("2", true)).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("3", true)).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("4", true)).to.be.true;
    await advancedPage.clickCustomFLTableHeadAlertIcon();
    await advancedPage.
      waitForCustomFilterListsNthItemTextToEqual("duplicate", "1");
    await advancedPage.clickCustomFLTableHeadAlertIcon();
    await advancedPage.
      waitForCustomFilterListsNthItemTextToEqual("duplicate", "4");
    await advancedPage.clickCustomFLTableHeadFilterRule();
    await advancedPage.
      waitForCustomFilterListsNthItemTextToEqual("! comment", "1");
    await advancedPage.
      waitForCustomFilterListsNthItemTextToEqual("##.hiding_filter", "2");
    await advancedPage.
      waitForCustomFilterListsNthItemTextToEqual("/blocking/filter/*", "3");
    await advancedPage.
      waitForCustomFilterListsNthItemTextToEqual("duplicate", "4");
    // Skip for FF because the sorting arrow doesn't currently work as expected
    if (browser.capabilities.browserName != "firefox")
    {
      await advancedPage.clickCustomFLTableHeadArrow();
      await advancedPage.
        waitForCustomFilterListsNthItemTextToEqual("! comment", "1");
      await advancedPage.
        waitForCustomFilterListsNthItemTextToEqual("/blocking/filter/*", "2");
      await advancedPage.
        waitForCustomFilterListsNthItemTextToEqual("duplicate", "3");
      await advancedPage.
        waitForCustomFilterListsNthItemTextToEqual("##.hiding_filter", "4");
    }
  });

  it("should delete multiple custom filters", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "");
    await browser.executeScript(
      `navigator.clipboard.writeText(\`${multipleFilters}\`);`, []);
    const platform = await browser.
      executeScript("return navigator.platform", []);
    let pasteKey = "Control";
    if (platform.includes("Mac"))
    {
      pasteKey = "Command";
    }
    await browser.keys([pasteKey, "V"]);
    await advancedPage.
      verifyTextPresentInCustomFLTable("duplicate");
    await advancedPage.clickCustomFilterListsNthItemCheckbox("3");
    await advancedPage.clickCustomFilterListsNthItemCheckbox("4");
    await advancedPage.clickDeleteCustomFLButton();
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("##.hiding_filter")).to.be.true;
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("/blocking/filter/*")).to.be.true;
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("duplicate", 1000)).to.be.false;
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("! comment", 1000)).to.be.false;
  });

  it("should edit a custom filter", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    const inputText = "test/filter.png";
    await advancedPage.typeTextToAddCustomFilterListInput(inputText);
    await advancedPage.clickAddCustomFilterListButton();
    await advancedPage.clickCustomFilterListsNthItemText("1");
    for (let i = 0; i < inputText.length; i++)
    {
      await browser.keys("ArrowLeft");
    }
    const text = "edited/";
    for (const char of text)
    {
      await browser.keys(char);
    }
    await browser.keys("Enter");
    await advancedPage.
      waitForCustomFilterListsNthItemTextToEqual(text + inputText, "1");
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable(inputText, 200)).to.be.false;
  }, 2);

  it("should edit a custom filter into an erroneous filter", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    const inputText = "test/filter.png";
    await advancedPage.typeTextToAddCustomFilterListInput(inputText);
    await advancedPage.clickAddCustomFilterListButton();
    await advancedPage.clickCustomFilterListsNthItemText("1");
    for (let i = 0; i < inputText.length; i++)
    {
      await browser.keys("Backspace");
    }
    const text = ",##foo";
    for (const char of text)
    {
      await browser.keys(char);
    }
    await browser.keys("Enter");
    expect(await advancedPage.
      isCustomFilterListsFirstItemErrorIconDisplayed()).to.be.true;
    await browser.refresh();
    await switchToABPOptionsTab();
    await advancedPage.init();
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable(inputText)).to.be.true;
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable(",##foo", 200)).to.be.false;
    expect(await advancedPage.
      isCustomFilterListsFirstItemAlertIconDisplayed(true)).to.be.true;
  });

  it("should search for custom filters", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.typeTextToAddCustomFilterListInput(
      "");
    await browser.executeScript(
      `navigator.clipboard.writeText(\`${multipleFilters}\`);`, []);
    const platform = await browser.
      executeScript("return navigator.platform", []);
    let pasteKey = "Control";
    if (platform.includes("Mac"))
    {
      pasteKey = "Command";
    }
    await browser.keys([pasteKey, "V"]);
    await advancedPage.
      verifyTextPresentInCustomFLTable("duplicate");
    await advancedPage.typeTextToAddCustomFilterListInput(
      "filter");
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("1")).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("2")).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("3", true)).to.be.true;
    expect(await advancedPage.
      isCustomFilterListsNthItemCheckboxChecked("4", true)).to.be.true;
  });

  it("should copy custom filters", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    const inputText = "www.adblock.org";
    await advancedPage.typeTextToAddCustomFilterListInput(inputText);
    await advancedPage.clickAddCustomFilterListButton();
    await advancedPage.clickCustomFilterListsNthItemCheckbox("1");
    await advancedPage.clickCopyCustomFLButton();
    await advancedPage.clickCustomFilterListsNthItemText("1");
    for (let i = 0; i < inputText.length; i++)
    {
      await browser.keys("Backspace");
    }
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable(inputText, 200)).to.be.false;
    const platform = await browser.
      executeScript("return navigator.platform", []);
    let pasteKey = "Control";
    if (platform.includes("Mac"))
    {
      pasteKey = "Command";
    }
    await browser.keys([pasteKey, "V"]);
    await browser.keys("Enter");
    if (await advancedPage.verifyTextPresentInCustomFLTable(inputText))
    {
      expect(await advancedPage.
        verifyTextPresentInCustomFLTable(inputText)).to.be.true;
    }
    else
    {
      expect(await advancedPage.
        verifyTextPresentInCustomFLTable(inputText + inputText)).to.be.true;
    }
  }, 2);
});
