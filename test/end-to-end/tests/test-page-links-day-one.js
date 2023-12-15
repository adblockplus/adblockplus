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

const {beforeSequence, globalRetriesNumber} =
  require("../helpers");
const {expect} = require("chai");
const DayOnePage = require("../page-objects/dayOne.page");
const dayOnePageData =
  require("../test-data/data-page-links").dayOnePageData;
let globalOrigin;

describe("test page links - day one", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    globalOrigin = await beforeSequence();
  });

  dayOnePageData.forEach(async(dataSet) =>
  {
    it("should have a link for: " + dataSet.testName, async function()
    {
      const dayOnePage = new DayOnePage(browser);
      await dayOnePage.init(globalOrigin);
      if (dataSet.testName == "Day 1 - Contact us")
      {
        expect(await dayOnePage[dataSet.elementToClick].
          getAttribute("href")).to.equal(dataSet.newTabUrl);
      }
      else if (dataSet.testName == "Day 1 - Learn more about " +
        "malicious advertising" || dataSet.testName == "Day 1 - Learn how")
      {
        await dayOnePage.waitForEnabledThenClick(
          dayOnePage[dataSet.elementToClick]);
        await dayOnePage.switchToTab(dataSet.newTabUrl);
        expect(await dayOnePage.getCurrentUrl()).to.match(
          dataSet.newTabUrl);
      }
      else
      {
        await dayOnePage.waitForEnabledThenClick(
          dayOnePage[dataSet.elementToClick]);
        await dayOnePage.switchToTab(dataSet.newTabUrl);
        try
        {
          expect(await dayOnePage.getCurrentUrl()).to.equal(
            dataSet.newTabUrl);
        }
        catch (Exception)
        {
          await dayOnePage.switchToTab("Adblock Plus | The world's" +
            " #1 free ad blocker");
          await browser.pause(500);
          expect(await dayOnePage.getCurrentUrl()).to.equal(
            dataSet.newTabUrl);
        }
      }
    });
  });
});
