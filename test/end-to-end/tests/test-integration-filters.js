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
const TestPages = require("../page-objects/testPages.page");
let lastTest = false;

describe("test custom filters as part of the integration tests", function()
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
      try
      {
        const advancedPage = new AdvancedPage(browser);
        await advancedPage.init();
        await advancedPage.clickCustomFLTableHeadCheckbox();
        await advancedPage.clickDeleteCustomFLButton();
      }
      catch (Exception) {}
      await afterSequence();
    }
  });

  it("should block/show ad by adding/removing custom filter", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    const multilineString = `
      /custom-blocking.js
      /custom-blocking-regex.*
      ###custom-hiding-id
      ##.custom-hiding-class
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
    const customFiltersTestPage = "https://adblockinc.gitlab.io/QA-team/adbl" +
      "ocking/custom-filters/custom-filters-testpage.html";
    await browser.newWindow(customFiltersTestPage);
    await browser.refresh();
    if (browser.capabilities.browserName == "MicrosoftEdge")
    {
      await browser.pause(2000);
    }
    const testPages = new TestPages(browser);
    if (browser.capabilities.browserName == "firefox")
    {
      if (await testPages.getCurrentTitle() !=
        "Blocking and hiding")
      {
        await testPages.switchToTab("Custom filters testpage");
        await browser.refresh();
      }
    }
    expect(await testPages.getCustomBlockingFilterText()).to.include(
      "custom blocking filter applied");
    expect(await testPages.getCustomBlockingRegexFilterText()).to.include(
      "custom blocking regex filter applied");
    expect(await testPages.
      isCustomHidingIdDisplayed()).to.be.false;
    expect(await testPages.
      isCustomHidingClassDisplayed()).to.be.false;
    await testPages.switchToABPOptionsTab(true);
    await advancedPage.clickCustomFilterListsNthItemCheckbox("1");
    await advancedPage.clickCustomFilterListsNthItemCheckbox("2");
    await advancedPage.clickCustomFilterListsNthItemCheckbox("3");
    await advancedPage.clickCustomFilterListsNthItemCheckbox("4");
    await advancedPage.clickDeleteCustomFLButton();
    await browser.newWindow(customFiltersTestPage);
    await browser.refresh();
    expect(await testPages.getCustomBlockingFilterText()).to.include(
      "custom blocking filter should block this");
    expect(await testPages.getCustomBlockingRegexFilterText()).to.include(
      "custom regex blocking filter should block this");
    expect(await testPages.getCustomHidingIdText()).to.include(
      "custom id hiding filter should hide this");
    expect(await testPages.getCustomHidingClassText()).to.include(
      "custom class hiding filter should hide this");
  });

  it("should block/show ad using enable/disable custom filter", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    const multilineString = `
      /custom-blocking.js
      /custom-blocking-regex.*
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
    await advancedPage.clickCustomFilterListsFirstItemToggle();
    const customFiltersTestPage = "https://adblockinc.gitlab.io/QA-team/adbl" +
      "ocking/custom-filters/custom-filters-testpage.html";
    await browser.newWindow(customFiltersTestPage);
    await browser.refresh();
    const testPages = new TestPages(browser);
    expect(await testPages.getCustomBlockingFilterText()).to.include(
      "custom blocking filter should block this");
    expect(await testPages.getCustomBlockingRegexFilterText()).to.include(
      "custom blocking regex filter applied");
    await testPages.switchToABPOptionsTab();
    await advancedPage.clickCustomFilterListsFirstItemToggle();
    await browser.newWindow(customFiltersTestPage);
    await browser.refresh();
    expect(await testPages.getCustomBlockingFilterText()).to.include(
      "custom blocking filter applied");
    expect(await testPages.getCustomBlockingRegexFilterText()).to.include(
      "custom blocking regex filter applied");
  });

  it("should block ad by edited custom filter", async function()
  {
    lastTest = true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    const inputText = "/custom-blocking.js";
    try
    {
      await advancedPage.clickCustomFLTableHeadCheckbox();
      await advancedPage.clickDeleteCustomFLButton();
    }
    catch (Exception) {}
    await advancedPage.typeTextToAddCustomFilterListInput(inputText);
    await advancedPage.clickAddCustomFilterListButton();
    await advancedPage.clickCustomFilterListsNthItemText("1");
    for (let i = 0; i < inputText.length; i++)
    {
      await browser.keys("Backspace");
    }
    const text = "/custom-blocking-regex.*";
    for (const char of text)
    {
      await browser.keys(char);
    }
    await browser.keys("Enter");
    const customFiltersTestPage = "https://adblockinc.gitlab.io/QA-team/adbl" +
      "ocking/custom-filters/custom-filters-testpage.html";
    await browser.newWindow(customFiltersTestPage);
    await browser.refresh();
    const testPages = new TestPages(browser);
    expect(await testPages.getCustomBlockingFilterText()).to.include(
      "custom blocking filter should block this");
    expect(await testPages.getCustomBlockingRegexFilterText()).to.include(
      "custom blocking regex filter applied");
  });
});
