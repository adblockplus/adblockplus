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
const GeneralPage = require("../page-objects/general.page");
const WelcomeToPremiumPage = require("../page-objects/welcomeToPremium.page");
let globalOrigin;

describe("should test onboarding page for premium user", function()
{
  this.retries(globalRetriesNumber);

  beforeEach(async function()
  {
    globalOrigin = await beforeSequence();
  });

  it("should display onboarding page for premium user", async function()
  {
    await enablePremiumByMockServer();
    await browser.newWindow(`${globalOrigin}/premium-onboarding.html`);
    const welcomeToPremiumPage = new WelcomeToPremiumPage(browser);
    await welcomeToPremiumPage.switchToTab("Welcome to Adblock Plus Premium");
    expect(await welcomeToPremiumPage.
      isBlockCookieConsentPopupsCheckboxEnabled()).to.be.true;
    expect(await welcomeToPremiumPage.
      isUpgradeNowButtonDisplayed()).to.be.false;
    expect(await welcomeToPremiumPage.
      isEnableAllPremiumFeaturesButtonDisplayed()).to.be.true;
    await welcomeToPremiumPage.clickEnableAllPremiumFeaturesButton();
    expect(await welcomeToPremiumPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.true;
    await welcomeToPremiumPage.clickDoneButton();
    await switchToABPOptionsTab();
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.true;
  });
});
