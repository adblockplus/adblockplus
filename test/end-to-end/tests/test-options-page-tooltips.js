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

const {afterSequence, beforeSequence, globalRetriesNumber} =
  require("../helpers");
const {expect} = require("chai");
const GeneralPage = require("../page-objects/general.page");
const AdvancedPage = require("../page-objects/advanced.page");
const dataTooltips = require("../test-data/data-tooltips");
let lastTest = false;

describe("test options page tooltips", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await afterSequence();
    }
  });

  it("should open notify me of available language fls tooltip", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickNotifyLanguageFilterListsTooltipIcon();
    expect(await generalPage.
      isNotifyLanguageFilterListsTooltipTextDisplayed()).to.be.true;
    expect(await generalPage.getNotifyLanguageFilterListsTooltipText()).
      to.equal(dataTooltips.notifyLanguageFilterListsTooltipText);
    await generalPage.clickNotifyLanguageFilterListsTooltipIcon();
    expect(await generalPage.
      isNotifyLanguageFilterListsTooltipTextDisplayed(true)).to.be.true;
  }, 2);

  it("should open show block element tooltip", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickShowBlockElementTooltipIcon();
    expect(await advancedPage.
      isShowBlockElementTooltipTextDisplayed()).to.be.true;
    expect(await advancedPage.getShowBlockElementTooltipText()).
      to.equal(dataTooltips.showBlockElementTooltipText);
    await advancedPage.clickShowBlockElementTooltipIcon();
    expect(await advancedPage.
      isShowBlockElementTooltipTextDisplayed(true)).to.be.true;
  }, 2);

  it("should open adblock plus panel tooltip", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickShowAdblockPlusPanelTooltipIcon();
    expect(await advancedPage.
      isShowAdblockPlusPanelTooltipTextDisplayed()).to.be.true;
    expect(await advancedPage.getShowAdblockPlusPanelTooltipText()).
      to.equal(dataTooltips.showAdblockPlusPanelTooltipText);
    await advancedPage.clickShowAdblockPlusPanelTooltipIcon();
    expect(await advancedPage.
      isShowAdblockPlusPanelTooltipTextDisplayed(true)).to.be.true;
  }, 2);

  it("should open turn on debug element tooltip", async function()
  {
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickTurnOnDebugElementTooltipIcon();
    expect(await advancedPage.
      isTurnOnDebugElementTooltipTextDisplayed()).to.be.true;
    expect(await advancedPage.getTurnOnDebugElementTooltipText()).
      to.equal(dataTooltips.turnOnDebugElementTooltipText);
    await advancedPage.clickTurnOnDebugElementTooltipIcon();
    expect(await advancedPage.
      isTurnOnDebugElementTooltipTextDisplayed(true)).to.be.true;
  }, 2);

  it("should open show useful notifications tooltip", async function()
  {
    lastTest = true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickShowUsefulNotificationsTooltipIcon();
    expect(await advancedPage.
      isShowUsefulNotificationsTooltipTextDisplayed()).to.be.true;
    expect(await advancedPage.getShowUsefulNotificationsTooltipText()).
      to.equal(dataTooltips.showUsefulNotificationsTooltipText);
    await advancedPage.clickShowUsefulNotificationsTooltipIcon();
    expect(await advancedPage.
      isShowUsefulNotificationsTooltipTextDisplayed(true)).to.be.true;
  }, 2);
});
