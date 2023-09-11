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
       globalRetriesNumber} = require("../helpers");
const {expect} = require("chai");
const GeneralPage = require("../page-objects/general.page");
const TestPages = require("../page-objects/testPages.page");

describe("test cookie consent filterlist blocking for premium users", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should block cookie banner", async function()
  {
    await enablePremiumByMockServer();
    const generalPage = new GeneralPage(browser);
    await browser.newWindow("https://shaack.com/projekte/cookie-consent-js/examples/cookie-consent-example.html");
    await generalPage.switchToTab("cookie-consent-js testpage");
    const testPages = new TestPages(browser);
    expect(await testPages.isCookieBannerDisplayed()).to.be.true;
    await generalPage.switchToABPOptionsTab();
    await generalPage.clickBlockCookieConsentPopupsCheckbox();
    await generalPage.clickBlockCookieConsentPopupsDialogOkButton();
    await generalPage.switchToTab("cookie-consent-js testpage");
    await browser.refresh();
    expect(await testPages.isCookieBannerDisplayed(true)).to.be.true;
  });
});
