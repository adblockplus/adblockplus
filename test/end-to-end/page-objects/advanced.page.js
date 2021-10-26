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

const BasePage = require("./base.page");

class AdvancedPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get _advancedTabButton()
  {
    return this.browser
      .$("//a[contains(@data-i18n, 'options_tab_advanced')" +
        "and text()='Advanced']");
  }

  async init()
  {
    await (await this._advancedTabButton).click();
  }

  get allowNonintrusiveAdvertisingFL()
  {
    return this.browser
      .$("//li[@aria-label='Allow nonintrusive advertising']");
  }

  get allowNonintrusiveAdvertisingWithoutTrackingFL()
  {
    return this.browser
      .$("//li[@aria-label='Allow nonintrusive advertising " +
      "without third-party tracking']");
  }

  get easyListFL()
  {
    return this.browser
      .$("//li[@aria-label='EasyList']");
  }

  get easyListGermanyPlusEasyListFL()
  {
    return this.browser
      .$("//li[@aria-label='EasyList Germany+EasyList']");
  }

  get easyPrivacyFL()
  {
    return this.browser
      .$("//li[@aria-label='EasyPrivacy']");
  }

  get fanboysNotificationsBlockingListFL()
  {
    return this.browser
      .$("//li[@aria-label=\"Fanboy's Notifications Blocking List\"]");
  }

  get fanboysSocialBlockingListFL()
  {
    return this.browser
      .$("//li[@aria-label=\"Fanboy's Social Blocking List\"]");
  }

  get filterListsLearnMoreLink()
  {
    return this.browser
      .$("//a[contains(@data-doclink, 'subscriptions')" +
        "and text()='Learn more']");
  }

  get iDontCareAboutCookiesFL()
  {
    return this.browser
      .$("//li[@aria-label=\"I don't care about cookies\"]");
  }

  get learnHowToWriteFiltersLink()
  {
    return this.browser
      .$("//a[text()='Learn how to write filters (English only)']");
  }

  get showAdblockPlusPanelCheckbox()
  {
    return this.browser
      .$("//li[@data-pref='show_devtools_panel']/button");
  }


  get showAdblockPlusPanelTooltipIcon()
  {
    return this.browser
      .$("//li[@data-pref='show_devtools_panel']" +
        "/io-popout");
  }

  get showAdblockPlusPanelTooltipText()
  {
    return this.browser
      .$("//li[@data-pref='show_devtools_panel']" +
        "/io-popout/div/div/p");
  }

  get showBlockElementCheckbox()
  {
    return this.browser
      .$("//li[@data-pref='shouldShowBlockElementMenu']/button");
  }

  get showBlockElementTooltipIcon()
  {
    return this.browser
      .$("//li[@data-pref='shouldShowBlockElementMenu']" +
        "/io-popout");
  }

  get showBlockElementTooltipText()
  {
    return this.browser
      .$("//li[@data-pref='shouldShowBlockElementMenu']" +
        "/io-popout/div/div/p");
  }

  get showNumberOfAdsBlockedCheckbox()
  {
    return this.browser
      .$("//li[@data-pref='show_statsinicon']/button");
  }

  get showUsefulNotificationsCheckbox()
  {
    return this.browser
      .$("//li[@data-pref='notifications_ignoredcategories']/button");
  }

  get showUsefulNotificationsTooltipIcon()
  {
    return this.browser
      .$("//li[@data-pref='notifications_ignoredcategories']" +
        "/io-popout");
  }

  get showUsefulNotificationsTooltipText()
  {
    return this.browser
      .$("//li[@data-pref='notifications_ignoredcategories']" +
        "/io-popout/div/div/p");
  }

  get turnOnDebugElementCheckbox()
  {
    return this.browser
      .$("//li[@data-pref='elemhide_debug']/button");
  }

  get turnOnDebugElementTooltipIcon()
  {
    return this.browser
      .$("//li[@data-pref='elemhide_debug']" +
        "/io-popout");
  }

  get turnOnDebugElementTooltipText()
  {
    return this.browser
      .$("//li[@data-pref='elemhide_debug']" +
        "/io-popout/div/div/p");
  }

  async clickFilterListsLearnMoreLink()
  {
    await (await this.filterListsLearnMoreLink).click();
  }

  async clickLearnHowToWriteFiltersLink()
  {
    await (await this.learnHowToWriteFiltersLink).click();
  }

  async clickShowAdblockPlusPanelCheckbox()
  {
    await (await this.showAdblockPlusPanelCheckbox).click();
  }

  async clickShowAdblockPlusPanelTooltipIcon()
  {
    await (await this.showAdblockPlusPanelTooltipIcon).click();
  }

  async clickShowBlockElementCheckbox()
  {
    await (await this.showBlockElementCheckbox).click();
  }

  async clickShowBlockElementTooltipIcon()
  {
    await (await this.showBlockElementTooltipIcon).click();
  }

  async clickShowNumberOfAdsBlockedCheckbox()
  {
    await (await this.showNumberOfAdsBlockedCheckbox).click();
  }

  async clickShowUsefulNotificationsTooltipIcon()
  {
    await (await this.showUsefulNotificationsTooltipIcon).click();
  }

  async clickTurnOnDebugElementCheckbox()
  {
    await (await this.turnOnDebugElementCheckbox).click();
  }

  async clickTurnOnDebugElementTooltipIcon()
  {
    await (await this.turnOnDebugElementTooltipIcon).click();
  }

  async getShowAdblockPlusPanelTooltipText()
  {
    return await (await this.showAdblockPlusPanelTooltipText).getText();
  }

  async getShowBlockElementTooltipText()
  {
    return await (await this.showBlockElementTooltipText).getText();
  }

  async clickShowUsefulNotificationsCheckbox()
  {
    await (await this.showUsefulNotificationsCheckbox).click();
  }

  async getShowUsefulNotificationsTooltipText()
  {
    return await (await this.showUsefulNotificationsTooltipText).getText();
  }

  async getTurnOnDebugElementTooltipText()
  {
    return await (await this.turnOnDebugElementTooltipText).getText();
  }

  async isAllowNonintrusiveAdvertisingFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.
    allowNonintrusiveAdvertisingFL);
  }

  async isAllowNonintrusiveAdvertisingWithoutTrackingFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.
    allowNonintrusiveAdvertisingWithoutTrackingFL);
  }

  async isEasyListFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.easyListFL);
  }

  async isEasyListGermanyPlusEasyListFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.
      easyListGermanyPlusEasyListFL);
  }

  async isEasyPrivacyFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.easyPrivacyFL);
  }

  async isFanboysNotificationsBlockingListFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.
    fanboysNotificationsBlockingListFL);
  }

  async isFanboysSocialBlockingListFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.
    fanboysSocialBlockingListFL);
  }

  async isIDontCareAboutCookiesFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.iDontCareAboutCookiesFL);
  }

  async isShowAdblockPlusPanelCheckboxSelected(expectedValue = "true",
                                               timeoutVal = 3000)
  {
    return await this.waitUntilIsSelected(this.showAdblockPlusPanelCheckbox,
                                          expectedValue, timeoutVal);
  }

  async isShowAdblockPlusPanelTooltipTextDisplayed()
  {
    return await (await this.showAdblockPlusPanelTooltipText).isDisplayed();
  }

  async isShowBlockElementCheckboxSelected(expectedValue = "true",
                                           timeoutVal = 3000)
  {
    return await this.waitUntilIsSelected(this.showBlockElementCheckbox,
                                          expectedValue, timeoutVal);
  }

  async isShowBlockElementTooltipTextDisplayed()
  {
    return await (await this.showBlockElementTooltipText).isDisplayed();
  }

  async isShowNumberOfAdsBlockedCheckboxSelected(expectedValue = "true",
                                                 timeoutVal = 3000)
  {
    return await this.waitUntilIsSelected(this.showNumberOfAdsBlockedCheckbox,
                                          expectedValue, timeoutVal);
  }

  async isShowUsefulNotificationsCheckboxSelected(expectedValue = "true",
                                                  timeoutVal = 3000)
  {
    return await this.waitUntilIsSelected(this.showUsefulNotificationsCheckbox,
                                          expectedValue, timeoutVal);
  }

  async isShowUsefulNotificationsTooltipTextDisplayed()
  {
    return await (await this.showUsefulNotificationsTooltipText).isDisplayed();
  }

  async isTurnOnDebugElementCheckboxSelected(expectedValue = "true",
                                             timeoutVal = 3000)
  {
    return await this.waitUntilIsSelected(this.turnOnDebugElementCheckbox,
                                          expectedValue, timeoutVal);
  }

  async isTurnOnDebugElementTooltipTextDisplayed()
  {
    return await (await this.turnOnDebugElementTooltipText).isDisplayed();
  }

  async switchToHowToWriteFiltersTab()
  {
    await this.switchToTab("How to write filters | Adblock Plus Help Center");
  }

  async switchToSubscriptionsTab()
  {
    await this.switchToTab("Known Adblock Plus subscriptions");
  }
}

module.exports = AdvancedPage;
