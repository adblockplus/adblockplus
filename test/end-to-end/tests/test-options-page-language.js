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
let lastTest = false;

describe("test options page general tab language", function()
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

  it("should have english in language table", async function()
  {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isEnglishLanguageTableItemDisplayed()).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isEasyListFLDisplayed()).to.be.true;
  });

  it("should add a language", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickAddALanguageButton();
    expect(await generalPage.
      isLanguagesDropdownDisplayed()).to.be.true;
    await generalPage.clickDeutschPlusEnglishListItem();
    expect(await generalPage.
      isLanguagesDropdownDisplayed(true)).to.be.true;
    expect(await generalPage.
      isDeutschPlusEnglishLanguageTableItemDisplayed()).to.be.true;
    expect(await generalPage.
      isEnglishLanguageTableItemDisplayed()).to.be.true;
    expect(await generalPage.
      isDeutschPlusEnglishLanguageTrashIconDisplayed()).to.be.true;
    expect(await generalPage.
      isEnglishLanguageTrashIconDisplayed()).to.be.true;
    expect(await generalPage.
      isEnglishLanguageChangeButtonDisplayed()).to.be.false;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isEasyListFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isEasyListGermanyPlusEasyListFLDisplayed()).to.be.true;
  });

  it("should remove a language", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickAddALanguageButton();
    await generalPage.clickDeutschPlusEnglishListItem();
    await browser.pause(1500);
    await generalPage.clickDeutschPlusEnglishLanguageTrashIcon();
    await browser.pause(1500);
    if (await generalPage.
      isDeutschPlusEnglishLanguageTableItemDisplayed(true) == false)
    {
      await generalPage.clickDeutschPlusEnglishLanguageTrashIcon();
      await browser.pause(1500);
    }
    expect(await generalPage.
      isDeutschPlusEnglishLanguageTableItemDisplayed(true)).to.be.true;
    await browser.pause(500);
    expect(await generalPage.
      isEnglishLanguageChangeButtonDisplayed()).to.be.true;
    await browser.pause(500);
    expect(await generalPage.
      isEnglishLanguageTrashIconDisplayed()).to.be.false;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isEasyListGermanyPlusEasyListFLDisplayed()).to.be.false;
  }, 2);

  it("should have filter list suggestions checkbox disabled", async function()
  {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isFilterListsSuggestionsCheckboxSelected(5000, true)).to.be.true;
    await generalPage.clickFilterListsSuggestionsCheckbox();
    expect(await generalPage.
      isFilterListsSuggestionsCheckboxSelected()).to.be.true;
    expect(await generalPage.
      isEnglishLanguageTableItemDisplayed()).to.be.true;
    await generalPage.clickFilterListsSuggestionsCheckbox();
    expect(await generalPage.
      isFilterListsSuggestionsCheckboxSelected(5000, true)).to.be.true;
    expect(await generalPage.
      isEnglishLanguageTableItemDisplayed()).to.be.true;
  });

  it("should change a language", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickEnglishLanguageChangeButton();
    if (await generalPage.
      isLanguagesDropdownDisplayed() == false)
    {
      await generalPage.clickEnglishLanguageChangeButton();
    }
    expect(await generalPage.
      isLanguagesDropdownDisplayed()).to.be.true;
    await generalPage.clickDeutschPlusEnglishListItem();
    expect(await generalPage.
      isLanguagesDropdownDisplayed(true)).to.be.true;
    expect(await generalPage.
      isDeutschPlusEnglishLanguageTableItemDisplayed()).to.be.true;
    expect(await generalPage.
      isEnglishLanguageTableItemDisplayed(true)).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    lastTest = true;
    expect(await advancedPage.
      isEasyListFLDisplayed()).to.be.false;
    expect(await advancedPage.
      isEasyListGermanyPlusEasyListFLDisplayed()).to.be.true;
  });
});
