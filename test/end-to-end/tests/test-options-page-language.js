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
let browser = null;

describe("test options page general tab language", () =>
{
  beforeEach(async() =>
  {
    let origin = null;
    [browser, origin] = await waitForExtension();
    await browser.url(`${origin}/desktop-options.html`);
  });

  afterEach(async() =>
  {
    await browser.deleteSession();
  });

  it("should have english in language table", async() =>
  {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isEnglishLanguageTableItemDisplayed()).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isEasyListFLDisplayed()).to.be.true;
  });

  it("should add a language", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickAddALanguageButton();
    expect(await generalPage.
      isLanguagesDropdownDisplayed()).to.be.true;
    await generalPage.clickDeutschPlusEnglishListItem();
    expect(await generalPage.
      isLanguagesDropdownDisplayed()).to.be.false;
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

  it("should remove a language", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickAddALanguageButton();
    await generalPage.clickDeutschPlusEnglishListItem();
    await generalPage.clickDeutschPlusEnglishLanguageTrashIcon();
    expect(await generalPage.
      isDeutschPlusEnglishLanguageTableItemDisplayed()).to.be.false;
    expect(await generalPage.
      isEnglishLanguageChangeButtonDisplayed()).to.be.true;
    expect(await generalPage.
      isEnglishLanguageTrashIconDisplayed()).to.be.false;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isEasyListGermanyPlusEasyListFLDisplayed()).to.be.false;
  });

  it("should change a language", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickEnglishLanguageChangeButton();
    expect(await generalPage.
      isLanguagesDropdownDisplayed()).to.be.true;
    await generalPage.clickDeutschPlusEnglishListItem();
    expect(await generalPage.
      isLanguagesDropdownDisplayed()).to.be.false;
    expect(await generalPage.
      isDeutschPlusEnglishLanguageTableItemDisplayed(true)).to.be.true;
    expect(await generalPage.
      isEnglishLanguageTableItemDisplayed()).to.be.false;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isEasyListFLDisplayed()).to.be.false;
    expect(await advancedPage.
      isEasyListGermanyPlusEasyListFLDisplayed()).to.be.true;
  });

  it("should have filter list suggestions checkbox enabled", async() =>
  {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isFilterListsSuggestionsCheckboxSelected()).to.be.true;
    await generalPage.clickFilterListsSuggestionsCheckbox();
    expect(await generalPage.
      isFilterListsSuggestionsCheckboxSelected()).to.be.false;
    expect(await generalPage.
      isEnglishLanguageTableItemDisplayed()).to.be.true;
    await generalPage.clickFilterListsSuggestionsCheckbox();
    expect(await generalPage.
      isFilterListsSuggestionsCheckboxSelected()).to.be.true;
    expect(await generalPage.
      isEnglishLanguageTableItemDisplayed()).to.be.true;
  });
});
