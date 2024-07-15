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

const {beforeSequence, globalRetriesNumber, isChrome, isFirefox} =
  require("../helpers");
const {expect} = require("chai");
const HeartDialogChunk = require("../page-objects/heartDialog.chunk");
const ProblemPage = require("../page-objects/problem.page");
const problemPageData =
  require("../test-data/data-page-links").problemPageData;
let globalOrigin;

describe("test page links - problem", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    ({origin: globalOrigin} = await beforeSequence());
  });

  problemPageData.forEach(async(dataSet) =>
  {
    it("should have a link for: " + dataSet.testName, async function()
    {
      const problemPage = new ProblemPage(browser);
      await problemPage.init(globalOrigin);
      if (dataSet.testName == "Problem - Envelope icon")
      {
        expect(await problemPage[dataSet.elementToClick].
          getAttribute("href")).to.equal(dataSet.newTabUrl);
      }
      else if (dataSet.testName == "Problem - Uninstall and reinstall")
      {
        await problemPage.waitForEnabledThenClick(
          problemPage[dataSet.elementToClick]);
        if (isChrome())
        {
          await problemPage.switchToTab(
            dataSet.chromeWebstorePageTitle);
          // Cookies agreement page was removed by Chrome.
          // Keeping this functionality here in case it changes back.
          // await browser.keys("Tab");
          // await browser.keys("Tab");
          // await browser.keys("Tab");
          // await browser.keys("Tab");
          // await browser.keys("Enter");
          expect(await problemPage.getCurrentUrl()).to.equal(
            dataSet.newTabUrlChrome);
        }
        else if (isFirefox())
        {
          const heartDialogChunk = new HeartDialogChunk(browser);
          await heartDialogChunk.switchToAddonsTab();
          expect(await heartDialogChunk.getCurrentUrl()).to.match(
            dataSet.newTabUrlFirefox);
        }
      }
      else if (dataSet.testName == "Problem - Facebook icon")
      {
        await problemPage.waitForEnabledThenClick(
          problemPage[dataSet.elementToClick]);
        try
        {
          await problemPage.switchToTab(dataSet.newTabUrl);
          expect(await problemPage.getCurrentUrl()).to.equal(
            dataSet.newTabUrl);
        }
        catch (Exception)
        {
          await problemPage.switchToTab(dataSet.fallbackNewTabUrl);
          expect(await problemPage.getCurrentUrl()).to.equal(
            dataSet.fallbackNewTabUrl);
        }
      }
      else if (dataSet.testName == "Problem - X icon")
      {
        await problemPage.waitForEnabledThenClick(
          problemPage[dataSet.elementToClick]);
        await problemPage.switchToTab(dataSet.newTabUrl);
        expect(await problemPage.getCurrentUrl()).to.match(
          dataSet.newTabUrl);
      }
      else
      {
        await problemPage.waitForEnabledThenClick(
          problemPage[dataSet.elementToClick]);
        await problemPage.switchToTab(dataSet.newTabUrl);
        try
        {
          expect(await problemPage.getCurrentUrl()).to.equal(
            dataSet.newTabUrl);
        }
        catch (Exception)
        {
          await problemPage.switchToTab("Adblock Plus | The world's" +
            " #1 free ad blocker");
          await browser.pause(500);
          expect(await problemPage.getCurrentUrl()).to.equal(
            dataSet.newTabUrl);
        }
      }
    });
  });
});
