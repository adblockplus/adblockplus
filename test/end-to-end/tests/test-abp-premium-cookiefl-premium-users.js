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

const {beforeSequence, enablePremiumByMockServer, getTabId,
       globalRetriesNumber, switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const GeneralPage = require("../page-objects/general.page");
const PopupPage = require("../page-objects/popup.page");
let globalOrigin;

describe("test cookie consent filterlist setting for premium users", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    ({origin: globalOrigin} = await beforeSequence());
  });

  // eslint-disable-next-line max-len
  it("should enable/disable cookie filterlist for premium user from the Advanced page", async function()
  {
    await enablePremiumByMockServer();
    await switchToABPOptionsTab();
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLDisplayed()).to.be.false;
    await advancedPage.clickAddBuiltinFilterListButton();
    await advancedPage.
      clickBuiltInFLTableItem("Premium - Block cookie consent pop-ups");
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLStatusToggleSelected()).to.be.true;
    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.true;
    await browser.newWindow("https://example.com");
    await advancedPage.switchToTab("Example Domain");
    let tabId = await getTabId({title: "Example Domain"});
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.true;
    await switchToABPOptionsTab();
    await advancedPage.init();
    await advancedPage.clickPremiumBlockCookieConsentPopupsFLStatusToggle();
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLStatusToggleSelected()).to.be.false;
    await generalPage.init();
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.false;
    await advancedPage.switchToTab("Example Domain");
    tabId = await getTabId({title: "Example Domain"});
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.false;
    await switchToABPOptionsTab();
    await advancedPage.init();
    await advancedPage.clickPremiumBlockCookieConsentPopupsFLStatusToggle();
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLStatusToggleSelected()).to.be.true;
    await generalPage.init();
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.true;
    await advancedPage.switchToTab("Example Domain");
    tabId = await getTabId({title: "Example Domain"});
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.true;
    await switchToABPOptionsTab();
    await advancedPage.init();
    await advancedPage.clickPremiumBlockCookieConsentPopupsFLTrashButton();
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLDisplayed()).to.be.false;
    await generalPage.init();
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.false;
    await advancedPage.switchToTab("Example Domain");
    tabId = await getTabId({title: "Example Domain"});
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.false;
  });

  // eslint-disable-next-line max-len
  it("should enable/disable cookie filterlist for premium user from the General tab", async function()
  {
    await enablePremiumByMockServer();
    const generalPage = new GeneralPage(browser);
    await switchToABPOptionsTab();
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.false;
    await generalPage.clickBlockCookieConsentPopupsCheckbox();
    expect(await generalPage.isBlockCookieConsentPopupsDialogDisplayed())
      .to.be.true;
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
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLStatusToggleSelected()).to.be.true;
    await browser.newWindow("https://example.com");
    await advancedPage.switchToTab("Example Domain");
    const tabId = await getTabId({title: "Example Domain"});
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.true;
    await browser.closeWindow();
    await switchToABPOptionsTab();
    await generalPage.init();
    await generalPage.clickBlockCookieConsentPopupsCheckbox();
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.false;
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLDisplayed()).to.be.false;
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.false;
  });

  // eslint-disable-next-line max-len
  it("should enable/disable cookie filterlist for premium user from the Popup page", async function()
  {
    await enablePremiumByMockServer();
    await browser.newWindow("https://example.com");
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.switchToTab("Example Domain");
    let tabId = await getTabId({title: "Example Domain"});
    let popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.false;
    await popupPage.clickBlockCookieConsentPopupsToggle();
    expect(await popupPage.isCookieConsentPopupsPopupDisplayed())
      .to.be.true;
    await popupPage.clickCookieConsentPopupsPopupNotNowButton();
    expect(await popupPage.isCookieConsentPopupsPopupDisplayed())
      .to.be.false;
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.false;
    await popupPage.clickBlockCookieConsentPopupsToggle();
    await popupPage.clickCookieConsentPopupsPopupOkGotItButton();
    expect(await popupPage.isCookieConsentPopupsPopupDisplayed())
      .to.be.false;
    const generalPage = new GeneralPage(browser);
    await switchToABPOptionsTab();
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.true;
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLStatusToggleSelected()).to.be.true;
    await browser.newWindow("https://example.com");
    await advancedPage.switchToTab("Example Domain");
    tabId = await getTabId({title: "Example Domain"});
    popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    await popupPage.clickBlockCookieConsentPopupsToggle();
    expect(await popupPage.
      isBlockCookieConsentPopupsToggleSelected()).to.be.false;
    await switchToABPOptionsTab();
    await generalPage.init();
    expect(await generalPage.
      isBlockCookieConsentPopupsCheckboxSelected()).to.be.false;
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumBlockCookieConsentPopupsFLDisplayed()).to.be.false;
  });
});
