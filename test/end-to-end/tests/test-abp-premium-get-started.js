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

const {beforeSequence, globalRetriesNumber,
       enablePremiumByUI} = require("../helpers");
const {expect} = require("chai");
const PremiumPage = require("../page-objects/premium.page");

describe("test abp premium get started", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should display onboarding page for premium user", async function()
  {
    await enablePremiumByUI();
    const premiumPage = new PremiumPage(browser);
    await premiumPage.switchToTab(/accounts.adblockplus.org/);
    await premiumPage.clickGetStartedWithABPPremiumButton();
    await premiumPage.switchToTab(/Get-started-with-AdBlock-Plus-Premium/);
    try
    {
      expect(await premiumPage.getCurrentUrl()).to.include(
        "Get-started-with-AdBlock-Plus-Premium");
    }
    catch (Exception)
    {
      await browser.pause(1000);
      await premiumPage.switchToTab(/Get-started-with-AdBlock-Plus-Premium/);
      await browser.pause(500);
      expect(await premiumPage.getCurrentUrl()).to.include(
        "Get-started-with-AdBlock-Plus-Premium");
    }
  });
});
