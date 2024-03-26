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

const {beforeSequence, afterSequence,
       switchToABPOptionsTab,
       enablePremiumByMockServer} = require("../helpers");
const {expect} = require("chai");
const BackgroundPage = require("../page-objects/background.page");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");
const serverResponsesData =
  require("../test-data/data-license-server-responses").serverResponsesData;
let globalOrigin;
let lastTest = false;

describe("test abp premium license server responses", function()
{
  before(async function()
  {
    globalOrigin = await beforeSequence();
  });

  afterEach(async function()
  {
    if (lastTest === false)
    {
      await browser.closeWindow();
      await afterSequence();
    }
  });

  serverResponsesData.forEach(async(dataSet) =>
  {
    it("should display response for: " + dataSet.testName, async function()
    {
      if (dataSet.testName == "invalid user id")
      {
        lastTest = true;
      }
      await enablePremiumByMockServer();
      const backgroundPage = new BackgroundPage(browser);
      await backgroundPage.init(globalOrigin);
      await switchToABPOptionsTab();
      await browser.executeScript(dataSet.request, []);
      await browser.refresh();
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
      await backgroundPage.switchToTab(/_generated_background_page\.html/);
      const consoleLog = await browser.getLogs("browser");
      expect(JSON.stringify(consoleLog)).to.match(dataSet.errorId);
    });
  });
});
