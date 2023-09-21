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

const {beforeSequence, globalRetriesNumber} = require("../helpers");
const {expect} = require("chai");
const WelcomeToPremiumPage = require("../page-objects/welcomeToPremium.page");
let globalOrigin;

describe("test abp premium onboarding free user", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    globalOrigin = await beforeSequence();
  });

  it("should test onboarding page for free user", async function()
  {
    await browser.newWindow(`${globalOrigin}/premium-onboarding.html`);
    const welcomeToPremiumPage = new WelcomeToPremiumPage(browser);
    await welcomeToPremiumPage.switchToTab("Welcome to Adblock Plus Premium");
    expect(await welcomeToPremiumPage.
      isUpgradeNowButtonDisplayed()).to.be.true;
    expect(await welcomeToPremiumPage.
      isEnableAllPremiumFeaturesButtonDisplayed()).to.be.false;
    await welcomeToPremiumPage.clickUpgradeNowButton();
    expect(await welcomeToPremiumPage.getCurrentUrl()).to.include(
      "https://accounts.adblockplus.org/en/premium");
  });
});
