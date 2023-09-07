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
const TestPages = require("../page-objects/testPages.page");

describe("test DC filterlist blocking for premium users", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should block distraction control content", async function()
  {
    await enablePremiumByMockServer();
    await browser.newWindow("https://adblockinc.gitlab.io/QA-team/" +
      "adblocking/DC-filters/DC-filters-testpage.html");
    const testPages = new TestPages(browser);
    await testPages.switchToTab("DC filters");
    expect(await testPages.
      isPushNotificationsHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isPushNotificationsBlockingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isAutoplayVideosHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isAutoplayVideosBlockingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isSurveysHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isSurveysBlockingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isNewsletterPopupsHidingFilterIdDisplayed()).to.be.false;
    expect(await testPages.
      isNewsletterPopupsBlockingFilterIdDisplayed()).to.be.false;
  });
});
