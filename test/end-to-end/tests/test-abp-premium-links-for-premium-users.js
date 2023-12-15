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

const {afterSequence, beforeSequence, enablePremiumByMockServer} =
  require("../helpers");
const {expect} = require("chai");
const ManagePremiumAccountPage =
  require("../page-objects/managePremiumAccount.page");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");
const linksPremiumUsers =
  require("../test-data/data-premium-links").linksPremiumUsers;
let lastTest = false;

describe("test premium links for free users", function()
{
  before(async function()
  {
    await beforeSequence();
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await browser.closeWindow();
      await afterSequence();
    }
  });

  linksPremiumUsers.forEach(async(dataSet) =>
  {
    it("should open link: " + dataSet.testName, async function()
    {
      if (dataSet.testName == "Options page - Premium button")
      {
        lastTest = true;
      }
      await enablePremiumByMockServer();
      const premiumHeaderChunk = new PremiumHeaderChunk(browser);
      await dataSet.clickOnLink(premiumHeaderChunk);
      await premiumHeaderChunk.switchToTab(
        "accounts.adblockplus.org");
      const currentUrl = await premiumHeaderChunk.getCurrentUrl();
      expect(currentUrl).to.match(
        /https:\/\/accounts\.adblockplus\.org\/en.*\/manage\?lic=license_code&s=desktop-options/);
      const managePremiumAccountPage = new ManagePremiumAccountPage(browser);
      try
      {
        expect(await managePremiumAccountPage.
          isNeedAFewMinutesErrorDisplayed()).to.be.true;
      }
      catch (Exception)
      {
        await premiumHeaderChunk.switchToTab(
          "accounts.adblockplus.org");
        await browser.pause(1000);
        expect(await managePremiumAccountPage.
          isNeedAFewMinutesErrorDisplayed()).to.be.true;
      }
    });
  });
});
