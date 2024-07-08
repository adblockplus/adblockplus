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
const FirstRunPage = require("../page-objects/firstRun.page");
const firstRunPageData =
  require("../test-data/data-page-links").firstRunPageData;
let globalOrigin;

describe("test page links - first run", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    ({origin: globalOrigin} = await beforeSequence());
  });

  firstRunPageData.forEach(async(dataSet) =>
  {
    it("should have a link for: " + dataSet.testName, async function()
    {
      let isPromotionLinksTest = false;
      if (dataSet.testName == "First run - App Store" ||
        dataSet.testName == "First run - Google Play")
      {
        isPromotionLinksTest = true;
      }
      if (browser.capabilities.browserName.toLowerCase().includes("edge") &&
        isPromotionLinksTest)
      {
        console.warn("Test skipped for Edge.");
      }
      else
      {
        const firstRunPage = new FirstRunPage(browser);
        try
        {
          await firstRunPage.switchToTab(/first-run.html/);
        }
        catch (Exception)
        {
          await firstRunPage.init(globalOrigin);
        }
        await firstRunPage.waitForEnabledThenClick(
          firstRunPage[dataSet.elementToClick]);
        await firstRunPage.switchToTab(dataSet.newTabUrl);
        if (dataSet.newTabUrl != "/options.html")
        {
          if (dataSet.testName == "First run - strict criteria" ||
            dataSet.testName == "First run - Turn off Acceptable Ads")
          {
            expect(await firstRunPage.getCurrentUrl()).to.match(
              dataSet.newTabUrl);
          }
          else
          {
            try
            {
              expect(await firstRunPage.getCurrentUrl()).to.equal(
                dataSet.newTabUrl);
            }
            catch (Exception)
            {
              await firstRunPage.switchToTab("Adblock Plus | The world's" +
                " #1 free ad blocker");
              await browser.pause(500);
              expect(await firstRunPage.getCurrentUrl()).to.equal(
                dataSet.newTabUrl);
            }
          }
        }
        else
        {
          expect(await firstRunPage.getCurrentUrl()).to.equal(
            globalOrigin + dataSet.newTabUrl);
        }
      }
    });
  });
});
