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

const {beforeSequence,
       globalRetriesNumber} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const multipleFilters =
  require("../test-data/data-custom-filters").multipleFilters;

describe("test advanced tab adding and removing custom filters", function()
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
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("##.hiding_filter")).to.be.true;
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("/blocking/filter/*")).to.be.true;
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("duplicate")).to.be.true;
    expect(await advancedPage.
      verifyTextPresentInCustomFLTable("! comment")).to.be.true;
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
    try
    {
      await advancedPage.
        verifyTextPresentInCustomFLTable("duplicate");
    }
    catch (Exception)
    {
      await advancedPage.typeTextToAddCustomFilterListInput(
        "");
      await browser.pause(1000);
      await browser.keys([pasteKey, "V"]);
      await advancedPage.
        verifyTextPresentInCustomFLTable("duplicate");
    }
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
    await advancedPage.clickCustomFLTableHeadCheckbox();
  });
});
