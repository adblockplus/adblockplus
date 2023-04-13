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
const customErrors = require("../test-data/data-custom-filters").customErrors;

describe("test advanced tab custom filters - custom errors", function()
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

  customErrors.forEach(async(dataSet) =>
  {
    it("should display filters errors: " + dataSet.testName, async function()
    {
      const advancedPage = new AdvancedPage(browser);
      await advancedPage.init();
      await advancedPage.typeTextToAddCustomFilterListInput(
        dataSet.customFilter);
      await advancedPage.clickAddCustomFilterListButton();
      expect(await advancedPage.getCustomFilterListsErrorText()).to.equal(
        dataSet.errorText);
    });
  });
});
