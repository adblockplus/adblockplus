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

const {beforeSequence, afterSequence, switchToABPOptionsTab,
       getTabId, doesTabExist} = require("../helpers");
const {expect} = require("chai");
const PopupPage = require("../page-objects/popup.page");
const TestPage = require("../page-objects/testPages.page");
const testData = require("../test-data/data-smoke-tests");
let globalOrigin;
let lastTest = false;

describe("test popup ui", function()
{
  before(async function()
  {
    globalOrigin = await beforeSequence();
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await afterSequence();
    }
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

  it("should use generic popup on non-https pages", async function()
  {
    await switchToABPOptionsTab();
    const tabId = await getTabId({title: "Adblock Plus Options"});
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.isPageStatsCounterDisplayed()).to.be.false;
    expect(await popupPage.isBlockSpecificElementButtonDisplayed()).to.be.false;
    expect(await popupPage.isPageToggleDisplayed()).to.be.false;
    expect(await popupPage.isDomainToggleDisplayed()).to.be.false;
    expect(await popupPage.isNothingToBlockTextDisplayed()).to.be.true;
  });

  it("shows block element UI when block element is clicked", async function()
  {
    const testPage = new TestPage(browser);
    await browser.newWindow("https://abptestpages.org");
    await testPage.switchToTab("ABP Test Pages");
    const tabId = await getTabId({title: "ABP Test Pages"});
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    await popupPage.clickBlockSpecificElementButton();
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.isBlockElementCancelButtonDisplayed()).to.be.true;
    expect(await popupPage.isBlockSpecificElementButtonDisplayed()).to.be.false;
    expect(await popupPage.isReportAnIssueButtonDisplayed()).to.be.false;
    await popupPage.clickBlockElementCancelButton();
    expect(await popupPage.isBlockElementCancelButtonDisplayed()).to.be.false;
    expect(await popupPage.isBlockSpecificElementButtonDisplayed()).to.be.true;
    expect(await popupPage.isReportAnIssueButtonDisplayed()).to.be.true;
  });

  it("opens issue reporter page when report issue is clicked", async function()
  {
    lastTest = true;
    await browser.newWindow("https://www.example.com");
    const tabId = await getTabId({title: "Example Domain"});
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    await browser.refresh();
    await popupPage.clickReportAnIssueButton();
    expect(await doesTabExist("Issue reporter")).to.be.true;
    expect(await doesTabExist("Example Domain", 5000, 2)).to.be.true;
  });
});
