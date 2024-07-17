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

const {beforeSequence, enablePremiumByMockServer, switchToABPOptionsTab,
       globalRetriesNumber, getTabId} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const GeneralPage = require("../page-objects/general.page");
const PopupPage = require("../page-objects/popup.page");
let globalOrigin;

describe("test DC filterlist setting for premium users", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    ({origin: globalOrigin} = await beforeSequence());
  });

  // eslint-disable-next-line max-len
  it("should disable/enable distraction control for premium user from the General tab", async function()
  {
    await enablePremiumByMockServer();
    const generalPage = new GeneralPage(browser);
    await switchToABPOptionsTab();
    expect(await generalPage.
      isBlockMoreDistractionsCheckboxSelected()).to.be.true;
    await generalPage.clickBlockMoreDistractionsCheckbox();
    expect(await generalPage.isBlockMoreDistractionsCheckboxSelected())
      .to.be.false;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumDistractionControlFLDisplayed()).to.be.false;
    await browser.newWindow("https://example.com");
    await advancedPage.switchToTab("Example Domain");
    const tabId = await getTabId({title: "Example Domain"});
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockMoreDistractionsToggleSelected()).to.be.false;
    await browser.closeWindow();
    await switchToABPOptionsTab();
    await generalPage.init();
    await generalPage.clickBlockMoreDistractionsCheckbox();
    expect(await generalPage.
      isBlockMoreDistractionsCheckboxSelected()).to.be.true;
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumDistractionControlFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isPremiumDistractionControlFLStatusToggleSelected()).to.be.true;
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockMoreDistractionsToggleSelected()).to.be.true;
  });

  // eslint-disable-next-line max-len
  it("should disable/enable distraction control for premium user from the Popup page", async function()
  {
    await enablePremiumByMockServer();
    await browser.newWindow("https://example.com");
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.switchToTab("Example Domain");
    let tabId = await getTabId({title: "Example Domain"});
    let popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockMoreDistractionsToggleSelected()).to.be.true;
    await popupPage.clickBlockMoreDistractionsToggle();
    expect(await popupPage.isBlockMoreDistractionsToggleSelected())
      .to.be.false;
    const generalPage = new GeneralPage(browser);
    await switchToABPOptionsTab();
    expect(await generalPage.
      isBlockMoreDistractionsCheckboxSelected()).to.be.false;
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumDistractionControlFLDisplayed()).to.be.false;
    await browser.newWindow("https://example.com");
    await advancedPage.switchToTab("Example Domain");
    tabId = await getTabId({title: "Example Domain"});
    popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    await popupPage.clickBlockMoreDistractionsToggle();
    expect(await popupPage.
      isBlockMoreDistractionsToggleSelected()).to.be.true;
    await switchToABPOptionsTab();
    await generalPage.init();
    expect(await generalPage.
      isBlockMoreDistractionsCheckboxSelected()).to.be.true;
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumDistractionControlFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isPremiumDistractionControlFLStatusToggleSelected()).to.be.true;
  });

  // eslint-disable-next-line max-len
  it("should disable/enable distraction control for premium user from the Advanced page", async function()
  {
    await enablePremiumByMockServer();
    await switchToABPOptionsTab();
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isPremiumDistractionControlFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isPremiumDistractionControlFLStatusToggleSelected()).to.be.true;
    await advancedPage.clickPremiumDistractionControlFLStatusToggle();
    expect(await advancedPage.
      isPremiumDistractionControlFLDisplayed()).to.be.true;
    expect(await advancedPage.
      isPremiumDistractionControlFLStatusToggleSelected()).to.be.false;
    const generalPage = new GeneralPage(browser);
    await generalPage.init();
    expect(await generalPage.
      isBlockMoreDistractionsCheckboxSelected()).to.be.false;
    await browser.newWindow("https://example.com");
    await advancedPage.switchToTab("Example Domain");
    let tabId = await getTabId({title: "Example Domain"});
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockMoreDistractionsToggleSelected()).to.be.false;
    await switchToABPOptionsTab();
    await advancedPage.init();
    await advancedPage.clickPremiumDistractionControlFLStatusToggle();
    expect(await advancedPage.
      isPremiumDistractionControlFLStatusToggleSelected()).to.be.true;
    await generalPage.init();
    expect(await generalPage.
      isBlockMoreDistractionsCheckboxSelected()).to.be.true;
    await advancedPage.switchToTab("Example Domain");
    tabId = await getTabId({title: "Example Domain"});
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockMoreDistractionsToggleSelected()).to.be.true;
    await switchToABPOptionsTab();
    await advancedPage.init();
    await advancedPage.clickPremiumBlockMoreDistractionsFLTrashButton();
    expect(await advancedPage.
      isPremiumDistractionControlFLDisplayed()).to.be.false;
    await generalPage.init();
    expect(await generalPage.
      isBlockMoreDistractionsCheckboxSelected()).to.be.false;
    await advancedPage.switchToTab("Example Domain");
    tabId = await getTabId({title: "Example Domain"});
    await popupPage.init(globalOrigin, tabId);
    expect(await popupPage.
      isBlockMoreDistractionsToggleSelected()).to.be.false;
  });
});
