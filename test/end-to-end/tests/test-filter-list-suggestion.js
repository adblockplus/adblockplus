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
const PopupPage = require("../page-objects/popup.page");
const GeneralPage = require("../page-objects/general.page");
let globalOrigin;

describe.skip("test filter list suggestion", function()
{
  this.retries(globalRetriesNumber);

  beforeEach(async function()
  {
    globalOrigin = await beforeSequence();
  });

  afterEach(async function()
  {
    await afterSequence();
  });

  it("should display default behaviour", async function()
  {
    await browser.url("https://www.ansa.it/");
    await browser.url("https://www.ilfattoquotidiano.it/");
    await browser.url("https://www.repubblica.it/");
    await browser.url("https://www.tiscali.it/");
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin);
    expect(await popupPage.
      isNotificationMessageDisplayed()).to.be.false;
  });

  it("should display filterlist suggestion notification", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickNotifyLanguageFilterListsTooltipCheckbox();
    await browser.url("https://www.ansa.it/");
    await browser.url("https://www.ilfattoquotidiano.it/");
    await browser.url("https://www.repubblica.it/");
    await browser.url("https://www.tiscali.it/");
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin);
    expect(await popupPage.
      isNotificationMessageDisplayed()).to.be.true;
    const notificationText = "It looks like you visited a website in: " +
      "italiano. Would you like to block ads on all websites " +
      "in this language?";
    expect(await popupPage.
      getNotificationMessageText().includes(notificationText)).to.be.true;
    await popupPage.clickYesButton();
    expect(await generalPage.
      getPredefinedDialogTitleText().includes("Are you sure you want to add" +
      " this filter list?")).to.be.true;
    await generalPage.clickAddPredefinedSubscriptionButton();
    expect(await generalPage.
      isItalianoPlusEnglishLanguageTableItemDisplayed()).to.be.true;
  });

  it("should not display FL suggestion for same TLD", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickNotifyLanguageFilterListsTooltipCheckbox();
    await browser.url("https://www.repubblica.it/");
    await browser.url("https://www.repubblica.it/politica");
    await browser.url("https://www.repubblica.it/economia");
    await browser.url("https://www.repubblica.it/esteri");
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin);
    expect(await popupPage.
      isNotificationMessageDisplayed()).to.be.false;
  });

  it("should only trigger notification once per language", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickNotifyLanguageFilterListsTooltipCheckbox();
    await browser.url("https://www.ansa.it/");
    await browser.url("https://www.ilfattoquotidiano.it/");
    await browser.url("https://www.repubblica.it/");
    await browser.url("https://www.tiscali.it/");
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin);
    expect(await popupPage.
      isNotificationMessageDisplayed()).to.be.true;
    await popupPage.clickCloseNotificationButton();
    await browser.url("https://www.ansa.it/");
    await browser.url("https://www.ilfattoquotidiano.it/");
    await browser.url("https://www.repubblica.it/");
    await browser.url("https://www.tiscali.it/");
    await popupPage.init(globalOrigin);
    expect(await popupPage.
      isNotificationMessageDisplayed()).to.be.false;
    await browser.url("https://www.lavanguardia.com/");
    await browser.url("https://elpais.com/");
    await browser.url("https://www.elmundo.es/");
    await browser.url("https://www.abc.es/");
    await popupPage.init(globalOrigin);
    expect(await popupPage.
      isNotificationMessageDisplayed()).to.be.true;
    expect(await popupPage.
      getNotificationMessageText().includes("español")).to.be.true;
  });

  it("should not trigger notification for more than 3 FLs", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickNotifyLanguageFilterListsTooltipCheckbox();
    await generalPage.clickAddALanguageButton();
    await generalPage.clickDeutschPlusEnglishListItem();
    await generalPage.clickAddALanguageButton();
    await generalPage.clickNederlandsPlusEnglishListItem();
    await browser.url("https://www.ansa.it/");
    await browser.url("https://www.ilfattoquotidiano.it/");
    await browser.url("https://www.repubblica.it/");
    await browser.url("https://www.tiscali.it/");
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin);
    expect(await popupPage.
      isNotificationMessageDisplayed()).to.be.false;
  });

  it("should not trigger notification if FL already installed", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickNotifyLanguageFilterListsTooltipCheckbox();
    await generalPage.clickAddALanguageButton();
    await generalPage.clickItalianoPlusEnglishListItem();
    await browser.url("https://www.ansa.it/");
    await browser.url("https://www.ilfattoquotidiano.it/");
    await browser.url("https://www.repubblica.it/");
    await browser.url("https://www.tiscali.it/");
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin);
    expect(await popupPage.
      isNotificationMessageDisplayed()).to.be.false;
  });
});
