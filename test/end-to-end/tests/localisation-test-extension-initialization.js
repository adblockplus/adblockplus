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

const {beforeSequence, globalRetriesNumber} = require("../helpers");
const {expect} = require("chai");
const GeneralPage = require("../page-objects/general.page");
let currentLocale;

describe("test extension initialization for language subscriptions", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    currentLocale = await browser.executeScript(
      "return navigator.language || navigator.userLanguage", []);
    let expectInstalledTab = true;
    if (currentLocale.includes("ca"))
      expectInstalledTab = false;
    await beforeSequence(expectInstalledTab);
  });

  // eslint-disable-next-line max-len
  it("should correctly initialize extension for different languages", async function()
  {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isAllowAcceptableAdsCheckboxSelected()).to.be.true;
    if (currentLocale.includes("de"))
    {
      expect(await generalPage.
        isDeutschPlusEnglischLanguageTableItemDisplayed()).to.be.true;
    }
    else if (currentLocale.includes("ca"))
    {
      expect(await generalPage.
        isEnglishLanguageTableItemDisplayed()).to.be.true;
    }
  });
});
