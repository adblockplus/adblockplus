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
const GeneralPage = require("../page-objects/general.page");

describe("test cookie consent filterlist setting for premium users", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should enable cookie filterlist for premium user", async function()
  {
    await enablePremiumByMockServer();
    const generalPage = new GeneralPage(browser);
    await switchToABPOptionsTab();
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.false;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLDisplayed(true)).to.be.true;
    await generalPage.init();
    await generalPage.clickBlockCookieConsentPopupsCheckbox();
    expect(await generalPage.isBlockCookieConsentPopupsDialogDisplayed())
      .to.be.true;
    expect(await generalPage.getBlockCookieConsentPopupsDialogText()).
    to.equal("By adding this feature and blocking these prompts, you are" +
    " consenting to not be notified about cookie usage and to edit cookie" +
    " settings on individual websites. You can change this at any time.");
    await generalPage.clickBlockCookieConsentPopupsDialogNoButton();
    expect(await generalPage.isBlockCookieConsentPopupsDialogDisplayed())
      .to.be.false;
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.false;
    await generalPage.clickBlockCookieConsentPopupsCheckbox();
    await generalPage.clickBlockCookieConsentPopupsDialogOkButton();
    expect(await generalPage.isBlockCookieConsentPopupsDialogDisplayed())
      .to.be.false;
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.true;
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLDisplayed()).to.be.true;
  });
});
