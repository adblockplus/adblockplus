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

const {beforeSequence} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const defaultFilterLists =
  require("../test-data/data-built-in-filter-lists").defaultFilterLists;
let flNames;

// eslint-disable-next-line max-len
describe("test built in filter list dropdown - default filter lists", function()
{
  before(async function()
  {
    await beforeSequence();
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickAddBuiltinFilterListButton();
    flNames = await advancedPage.getBuiltInFilterListsItemsNames();
  });

  defaultFilterLists.forEach(async(dataSet) =>
  {
    it("should display filter list: " + dataSet.flName, async function()
    {
      if (dataSet.flName == "Snippets")
      {
        if (process.env.MANIFEST_VERSION === "3")
        {
          dataSet.flId = "ABP filters (compliance) " +
            "(ABP Anti-Circumvention Filter List)";
        }
      }
      if (dataSet.flStatus == "present")
      {
        expect(flNames).to.include(dataSet.flId);
      }
      else
      {
        expect(flNames).to.not.include(dataSet.flId);
      }
    });
  });
});
