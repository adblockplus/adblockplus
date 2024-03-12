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

const {beforeSequence, getTabId} = require("../helpers");
const {expect} = require("chai");
const PopupPage = require("../page-objects/popup.page");
const TestPage = require("../page-objects/testPages.page");
const testData = require("../test-data/data-smoke-tests");
let globalOrigin;

describe("test popup ui", function()
{
  before(async function()
  {
    globalOrigin = await beforeSequence();
  });

  it("should display number of ads blocked", async function()
  {
    const testPage = new TestPage(browser);
    await browser.newWindow(testData.blockHideUrl);
    await testPage.switchToTab("Blocking and hiding");
    const tabId = await getTabId({title: "Blocking and hiding"});
    // reload page 2x
    await browser.refresh();
    await browser.refresh();
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    const totalPageAdsBlocked = await popupPage.
        getNumberOfAdsBlockedOnThisPageText();
    const totalAdsBlocked = await popupPage.getNumberOfAdsBlockedInTotalText();
    expect(totalPageAdsBlocked).to.not.equal(0);
    expect(totalAdsBlocked).to.not.equal(0);
  });
});

