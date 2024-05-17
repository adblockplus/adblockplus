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

const {beforeSequence, switchToABPOptionsTab,
       enablePremiumByMockServer} = require("../helpers");
const {expect} = require("chai");
const ServiceWorkerPage = require("../page-objects/serviceWorker.page");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");
const serverResponsesData =
  require("../test-data/data-license-server-responses").serverResponsesData;

describe("test abp premium license server responses", function()
{
  before(async function()
  {
    await beforeSequence();
  });

  serverResponsesData.forEach(async(dataSet) =>
  {
    it("should display response for: " + dataSet.testName, async function()
    {
      await switchToABPOptionsTab();
      await enablePremiumByMockServer();
      const serviceWorkerPage = new ServiceWorkerPage(browser);
      await serviceWorkerPage.init();
      await switchToABPOptionsTab();
      await browser.executeScript(dataSet.request, []);
      const premiumHeaderChunk = new PremiumHeaderChunk(browser);
      if (dataSet.premiumStatus == "enabled")
      {
        expect(await premiumHeaderChunk.isPremiumButtonDisplayed()).to.be.true;
      }
      else
      {
        expect(await premiumHeaderChunk.isUpgradeButtonDisplayed(10000)).
          to.be.true;
      }
      await serviceWorkerPage.switchToTab(/serviceworker-internals/);
      const logText = await serviceWorkerPage.getLogTextAreaText();
      expect(logText).to.match(dataSet.errorId);
      await browser.closeWindow();
    });
  });
});
