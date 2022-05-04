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
const AdvancedPage = require("../page-objects/advanced.page");

describe("test advanced tab customizations", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should display show number of ads blocked as checked", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isShowNumberOfAdsBlockedCheckboxSelected()).to.be.true;
    await advancedPage.clickShowNumberOfAdsBlockedCheckbox();
    expect(await advancedPage.
      isShowNumberOfAdsBlockedCheckboxSelected("false")).to.be.true;
    await advancedPage.clickShowNumberOfAdsBlockedCheckbox();
    expect(await advancedPage.
      isShowNumberOfAdsBlockedCheckboxSelected()).to.be.true;
  });

  it("should display show block element menu as checked", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isShowBlockElementCheckboxSelected()).to.be.true;
    await advancedPage.clickShowBlockElementCheckbox();
    expect(await advancedPage.
      isShowBlockElementCheckboxSelected("false")).to.be.true;
    await advancedPage.clickShowBlockElementCheckbox();
    expect(await advancedPage.
      isShowBlockElementCheckboxSelected()).to.be.true;
  });

  it("should display show adblock plus panel as checked", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isShowAdblockPlusPanelCheckboxSelected()).to.be.true;
    await advancedPage.clickShowAdblockPlusPanelCheckbox();
    expect(await advancedPage.
      isShowAdblockPlusPanelCheckboxSelected("false")).to.be.true;
    await advancedPage.clickShowAdblockPlusPanelCheckbox();
    expect(await advancedPage.
      isShowAdblockPlusPanelCheckboxSelected()).to.be.true;
  });

  it("should display turn on debug element as unchecked", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isTurnOnDebugElementCheckboxSelected("false")).to.be.true;
    await advancedPage.clickTurnOnDebugElementCheckbox();
    expect(await advancedPage.
      isTurnOnDebugElementCheckboxSelected()).to.be.true;
    await advancedPage.clickTurnOnDebugElementCheckbox();
    expect(await advancedPage.
      isTurnOnDebugElementCheckboxSelected("false")).to.be.true;
  });

  it("should display show useful notifications as checked", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isShowUsefulNotificationsCheckboxSelected()).to.be.true;
    await advancedPage.clickShowUsefulNotificationsCheckbox();
    expect(await advancedPage.
      isShowUsefulNotificationsCheckboxSelected("false")).to.be.true;
    await advancedPage.clickShowUsefulNotificationsCheckbox();
    expect(await advancedPage.
      isShowUsefulNotificationsCheckboxSelected()).to.be.true;
  });
});
