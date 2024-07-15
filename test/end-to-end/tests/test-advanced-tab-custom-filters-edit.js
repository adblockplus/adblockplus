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

const {beforeSequence, globalRetriesNumber, isFirefox,
       switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const multipleFilters =
  require("../test-data/data-custom-filters").multipleFilters;

describe("test advanced tab editing custom filters", function()
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
    await advancedPage.clickDeleteCustomFLButton();
  });

  it("should sort custom filters", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickCustomFLTableHeadCheckbox();
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
    try
    {
      await advancedPage.
        waitForCustomFilterListsNthItemTextToEqual("##.hiding_filter", "1");
    }
    catch (Exception)
    {
      await advancedPage.typeTextToAddCustomFilterListInput(
        "");
      await browser.pause(1000);
      await browser.keys([pasteKey, "V"]);
      await advancedPage.
        waitForCustomFilterListsNthItemTextToEqual("##.hiding_filter", "1");
    }
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
    if (!isFirefox())
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

  it("should edit a custom filter", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    const inputText = "test/filter.png";
    await advancedPage.typeTextToAddCustomFilterListInput("test/filter.png");
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
  });

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
    try
    {
      await advancedPage.
        waitForCustomFilterListsNthItemTextToEqual("##.hiding_filter", "1");
    }
    catch (Exception)
    {
      await advancedPage.typeTextToAddCustomFilterListInput(
        "");
      await browser.pause(1000);
      await browser.keys([pasteKey, "V"]);
    }
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
    await advancedPage.typeTextToAddCustomFilterListInput("");
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
    await advancedPage.typeTextToAddCustomFilterListInput("");
    const platform = await browser.
      executeScript("return navigator.platform", []);
    let pasteKey = "Control";
    if (platform.includes("Mac"))
    {
      pasteKey = "Command";
    }
    await browser.keys([pasteKey, "V"]);
    await browser.keys("Enter");
    try
    {
      expect(await advancedPage.
        verifyTextPresentInCustomFLTable(inputText)).to.be.true;
    }
    catch (Exception)
    {
      await browser.keys([pasteKey, "V"]);
      await browser.keys("Enter");
      expect(await advancedPage.
        verifyTextPresentInCustomFLTable(inputText)).to.be.true;
    }
  });
});
