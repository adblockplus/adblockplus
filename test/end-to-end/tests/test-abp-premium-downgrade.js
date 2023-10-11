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

const {beforeSequence, enablePremiumByMockServer,
       globalRetriesNumber, switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const ExtensionsPage = require("../page-objects/extensions.page");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");

describe("test abp premium downgrade", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should downgrade premium user", async function()
  {
    await enablePremiumByMockServer();
    const premiumHeaderChunk = new PremiumHeaderChunk(browser);
    expect(await premiumHeaderChunk.isPremiumButtonDisplayed()).to.be.true;
    await browser.executeAsync(async(done) =>
    {
      try
      {
        const response = await browser.runtime.sendMessage({
          type: "premium.activate", userId: "expired_user_id"});
        done(response);
      }
      catch (error)
      {
        done(error);
      }
    });
    expect(await premiumHeaderChunk.isUpgradeButtonDisplayed(10000)).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumDistractionControlFLDisplayed(true)).to.be.true;
    const extensionsPage = new ExtensionsPage(browser);
    await extensionsPage.init();
    await extensionsPage.clickReloadHelperExtensionButton();
    await switchToABPOptionsTab();
    expect(await premiumHeaderChunk.isUpgradeButtonDisplayed(10000)).to.be.true;
  });
});
