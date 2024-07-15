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

const {beforeSequence, globalRetriesNumber, isChrome, isFirefox, isEdge} =
  require("../helpers");
const {expect} = require("chai");
const HeartDialogChunk = require("../page-objects/heartDialog.chunk");
const UpdatesPage = require("../page-objects/updates.page");
const updatesPageData =
  require("../test-data/data-page-links").updatesPageData;
let globalOrigin;

describe("test page links - updates", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    ({origin: globalOrigin} = await beforeSequence());
  });

  updatesPageData.forEach(async(dataSet) =>
  {
    it("should have a link for: " + dataSet.testName, async function()
    {
      if (dataSet.testName == "Updates - Rate it" && isEdge())
        this.skip();

      const updatesPage = new UpdatesPage(browser);
      await updatesPage.init(globalOrigin);
      if (dataSet.testName == "Updates - Envelope icon")
      {
        expect(await updatesPage[dataSet.elementToClick].
          getAttribute("href")).to.equal(dataSet.newTabUrl);
      }
      else if (dataSet.testName == "Updates - Rate it")
      {
        await updatesPage.waitForEnabledThenClick(
          updatesPage[dataSet.elementToClick]);
        if (isChrome())
        {
          await updatesPage.switchToTab(dataSet.chromeWebstorePageTitle);
          // Cookies agreement page was removed by Chrome.
          // Keeping this functionality here in case it changes back.
          // await browser.keys("Tab");
          // await browser.keys("Tab");
          // await browser.keys("Tab");
          // await browser.keys("Tab");
          // await browser.keys("Enter");
          expect(await updatesPage.getCurrentUrl()).to.equal(
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
      else if (dataSet.testName == "Updates - Facebook icon")
      {
        await updatesPage.waitForEnabledThenClick(
          updatesPage[dataSet.elementToClick]);
        try
        {
          await updatesPage.switchToTab(dataSet.newTabUrl);
          expect(await updatesPage.getCurrentUrl()).to.include(
            dataSet.newTabUrl);
        }
        catch (Exception)
        {
          await updatesPage.switchToTab(dataSet.fallbackNewTabUrl);
          expect(await updatesPage.getCurrentUrl()).to.include(
            dataSet.fallbackNewTabUrl);
        }
      }
      else if (dataSet.testName == "Updates - X icon")
      {
        await updatesPage.waitForEnabledThenClick(
          updatesPage[dataSet.elementToClick]);
        await updatesPage.switchToTab(dataSet.newTabUrl);
        expect(await updatesPage.getCurrentUrl()).to.match(dataSet.newTabUrl);
      }
      else
      {
        await updatesPage.waitForEnabledThenClick(
          updatesPage[dataSet.elementToClick]);
        await updatesPage.switchToTab(dataSet.newTabUrl);
        expect(await updatesPage.getCurrentUrl()).to.include(dataSet.newTabUrl);
      }
    });
  });
});
