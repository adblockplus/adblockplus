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
    return $("//a[contains(@data-i18n, 'options_tab_advanced')" +
        "and text()='Advanced']");
  }

  async init()
  {
    await (await this._advancedTabButton).click();
  }

  get abpFiltersFL()
  {
    return $("//li[@aria-label='ABP filters']");
  }

  get abpFiltersFLLastUpdatedText()
  {
    return $("//li[@aria-label='ABP filters']/div/span[@class='last-update']");
  }

  get abpFiltersFLStatusToggle()
  {
    return $("//li[@aria-label='ABP filters']/div/io-toggle/button");
  }

  get abpTestFilterErrorIcon()
  {
    return this.browser.$("//li[@aria-label='ABP_TEST_FILTER']/div/io-popout");
  }

  get addAFilterListButton()
  {
    return $("//button[@data-action='validate-import-subscription']");
  }

  get addBuiltinFilterListButton()
  {
    return this.browser.$("#filters-boxlabel");
  }

  get addCustomFilterListButton()
  {
    return $("//io-filter-table/io-filter-search/button");
  }

  get addCustomFilterListInput()
  {
    return $("//io-filter-search/input");
  }

  get addNewFilterListButton()
  {
    return $("//button[@data-i18n='options_filterList_add']");
  }

  get addNewFilterListDialog()
  {
    return this.browser.$("#filterlist-by-url");
  }

  get allowNonintrusiveAdvertisingFL()
  {
    return $("//li[@aria-label='Allow nonintrusive advertising']");
  }

  get allowNonintrusiveAdvertisingFLLastUpdatedText()
  {
    return $("//li[@aria-label='Allow nonintrusive advertising']" +
      "/div/span[@class='last-update']");
  }

  get allowNonintrusiveAdvertisingFLStatusToggle()
  {
    return $("//li[@aria-label='Allow nonintrusive advertising']" +
      "/div/io-toggle/button");
  }

  get allowNonintrusiveAdvertisingWithoutTrackingFL()
  {
    return $("//li[@aria-label='Allow nonintrusive advertising " +
      "without third-party tracking']");
  }

  get cancelAddingFLButton()
  {
    return this.browser.$("//button[@data-action='close-filterlist-by-url']");
  }

  get customFilterListsFirstItemToggle()
  {
    return $("//io-filter-list/table/tbody/tr[1]/td[2]/io-toggle/button");
  }

  get easyListFL()
  {
    return $("//li[@aria-label='EasyList']");
  }

  get easyListFLGearIcon()
  {
    return $("//li[@aria-label='EasyList']" +
      "/div/io-popout[@type='menubar']");
  }

  get easyListFLLastUpdatedText()
  {
    return $("//li[@aria-label='EasyList']/div/span[@class='last-update']");
  }

  get easyListFLSourceButton()
  {
    return $("//li[@aria-label='EasyList']" +
      "/div/io-popout[@type='menubar']" +
      "/div/div/ul/li/a[@data-i18n='options_filterList_source']");
  }

  get easyListFLStatusToggle()
  {
    return $("//li[@aria-label='EasyList']/div/io-toggle/button");
  }

  get easyListFLTrashButton()
  {
    return $("//li[@aria-label='EasyList']/div/button" +
      "[@data-action='remove-subscription']");
  }

  get easyListFLUpdateNowButton()
  {
    return $("//li[@aria-label='EasyList']" +
      "/div/io-popout[@type='menubar']" +
      "/div/div/ul/li/button[@data-i18n='options_filterList_updateNow']");
  }

  get easyListFLWebsiteButton()
  {
    return $("//li[@aria-label='EasyList']" +
      "/div/io-popout[@type='menubar']" +
      "/div/div/ul/li/a[@data-i18n='options_filterList_website']");
  }

  get easyListGermanyPlusEasyListFL()
  {
    return $("//li[@aria-label='EasyList Germany+EasyList']");
  }

  get easyPrivacyFL()
  {
    return this.browser.$("//li[@aria-label='EasyPrivacy']");
  }

  get enableThemButton()
  {
    return this.browser.$("//a[@data-action='enable-filters']");
  }

  get fanboysNotificationsBlockingListFL()
  {
    return $("//li[@aria-label=\"Fanboy's Notifications Blocking List\"]");
  }

  get fanboysSocialBlockingListFL()
  {
    return $("//li[@aria-label=\"Fanboy's Social Blocking List\"]");
  }

  get filterListsDropdown()
  {
    return this.browser.$("#filters-boxpopup");
  }

  get filterListErrorPopout()
  {
    return $("//io-popout[@data-template-i18n-body=" +
      "'options_filterList_errorPopup_title']");
  }

  get filterListsLearnMoreLink()
  {
    return $("//a[contains(@data-doclink, 'subscriptions')" +
        "and text()='Learn more']");
  }

  get filterListUrlInput()
  {
    return this.browser.$("#import-list-url");
  }

  get iDontCareAboutCookiesFL()
  {
    return $("//li[@aria-label=\"I don't care about cookies\"]");
  }

  get learnHowToWriteFiltersLink()
  {
    return $("//a[text()='Learn how to write filters (English only)']");
  }

  get listeFREasyListFL()
  {
    return this.browser.$("//li[@aria-label='Liste FR+EasyList']");
  }

  get listeFREasyListFLDropdownItem()
  {
    return $("//*[@id='filters-boxpopup']/" +
      "li[contains(text(),'Liste FR+EasyList (français + English)')]");
  }

  get listeFREasyListFLStatusToggle()
  {
    return $("//li[@aria-label='Liste FR+EasyList']/div/io-toggle/button");
  }

  get showAdblockPlusPanelCheckbox()
  {
    return $("//li[@data-pref='show_devtools_panel']/button");
  }


  get showAdblockPlusPanelTooltipIcon()
  {
    return $("//li[@data-pref='show_devtools_panel']" +
        "/io-popout");
  }

  get showAdblockPlusPanelTooltipText()
  {
    return $("//li[@data-pref='show_devtools_panel']" +
        "/io-popout/div/div/p");
  }

  get showBlockElementCheckbox()
  {
    return $("//li[@data-pref='shouldShowBlockElementMenu']/button");
  }

  get showBlockElementTooltipIcon()
  {
    return $("//li[@data-pref='shouldShowBlockElementMenu']" +
        "/io-popout");
  }

  get showBlockElementTooltipText()
  {
    return $("//li[@data-pref='shouldShowBlockElementMenu']" +
        "/io-popout/div/div/p");
  }

  get showNumberOfAdsBlockedCheckbox()
  {
    return $("//li[@data-pref='show_statsinicon']/button");
  }

  get showUsefulNotificationsCheckbox()
  {
    return $("//li[@data-pref='notifications_ignoredcategories']/button");
  }

  get showUsefulNotificationsTooltipIcon()
  {
    return $("//li[@data-pref='notifications_ignoredcategories']" +
        "/io-popout");
  }

  get showUsefulNotificationsTooltipText()
  {
    return $("//li[@data-pref='notifications_ignoredcategories']" +
        "/io-popout/div/div/p");
  }

  get testFilterList()
  {
    return this.browser.$("//li[@aria-label='https://test-filterlist.txt']");
  }

  get testFilterListNoHtttps()
  {
    return this.browser.$("//li[@aria-label='test-filterlist.txt']");
  }

  get testFilterListStatusToggle()
  {
    return $("//li[@aria-label='https://test-filterlist.txt']" +
      "/div/io-toggle/button");
  }

  get turnOnDebugElementCheckbox()
  {
    return $("//li[@data-pref='elemhide_debug']/button");
  }

  get turnOnDebugElementTooltipIcon()
  {
    return $("//li[@data-pref='elemhide_debug']" +
        "/io-popout");
  }

  get turnOnDebugElementTooltipText()
  {
    return $("//li[@data-pref='elemhide_debug']" +
        "/io-popout/div/div/p");
  }

  get updateAllFilterlistsButton()
  {
    return $("#update");
  }

  get urlErrorMessage()
  {
    return $("//span[contains(@class, 'error-msg')" +
        "and text()='URL must start with https://.']");
  }

  async clickAbpTestFilterErrorIcon()
  {
    await (await this.abpTestFilterErrorIcon).click();
  }

  async clickAddAFilterListButton()
  {
    await (await this.addAFilterListButton).click();
  }

  async clickAddBuiltinFilterListButton()
  {
    await (await this.addBuiltinFilterListButton).click();
  }

  async clickAddCustomFilterListButton()
  {
    await this.waitForEnabledThenClick(this.addCustomFilterListButton);
  }

  async clickAddNewFilterListButton()
  {
    await (await this.addNewFilterListButton).click();
  }

  async clickCancelAddingFLButton()
  {
    await (await this.cancelAddingFLButton).click();
  }

  async clickCustomFilterListsFirstItemToggle()
  {
    await (await this.customFilterListsFirstItemToggle).click();
  }

  async clickEasyListFLGearIcon()
  {
    await (await this.easyListFLGearIcon).click();
  }

  async clickEasyListFLSourceButton()
  {
    await (await this.easyListFLSourceButton).click();
  }

  async clickEasyListFLStatusToggle()
  {
    await (await this.easyListFLStatusToggle).click();
  }

  async clickEasyListFLTrashButton()
  {
    await (await this.easyListFLTrashButton).click();
  }

  async clickEasyListFLUpdateNowButton()
  {
    await (await this.easyListFLUpdateNowButton).click();
  }

  async clickEasyListFLWebsiteButton()
  {
    await (await this.easyListFLWebsiteButton).click();
  }

  async clickEnableThemButton()
  {
    await (await this.enableThemButton).click();
  }

  async clickFilterListsLearnMoreLink()
  {
    await (await this.filterListsLearnMoreLink).click();
  }

  async clickLearnHowToWriteFiltersLink()
  {
    await (await this.learnHowToWriteFiltersLink).click();
  }

  async clickListeFREasyListFL()
  {
    await this.scrollIntoViewAndClick(this.listeFREasyListFLDropdownItem);
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

  async clickShowUsefulNotificationsCheckbox()
  {
    await (await this.showUsefulNotificationsCheckbox).click();
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

  async clickUpdateAllFilterlistsButton()
  {
    await (await this.updateAllFilterlistsButton).click();
  }

  async getShowAdblockPlusPanelTooltipText()
  {
    return await (await this.showAdblockPlusPanelTooltipText).getText();
  }

  async getShowBlockElementTooltipText()
  {
    return await (await this.showBlockElementTooltipText).getText();
  }

  async getShowUsefulNotificationsTooltipText()
  {
    return await (await this.showUsefulNotificationsTooltipText).getText();
  }

  async getTurnOnDebugElementTooltipText()
  {
    return await (await this.turnOnDebugElementTooltipText).getText();
  }

  async isAbpFiltersFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.abpFiltersFL);
  }

  async isAbpFiltersFLStatusToggleSelected()
  {
    return await (await this.abpFiltersFLStatusToggle).
    getAttribute("aria-checked") === "true";
  }

  async isAbpFiltersFLUpdating()
  {
    return await (await this.abpFiltersFL).
    getAttribute("class") === "show-message";
  }

  async isAbpFiltersFLUpdatingDone()
  {
    return await this.waitUntilAttributeValueIs(
      this.abpFiltersFL, "class",
      "show-message", 10000, true);
  }

  async isAbpTestFilterErrorIconDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.abpTestFilterErrorIcon,
                                              reverseOption);
  }

  async isAddNewFilterListDialogDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.addNewFilterListDialog,
                                              reverseOption);
  }

  async isAllowNonintrusiveAdvertisingFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.
    allowNonintrusiveAdvertisingFL);
  }

  async isAllowNonintrusiveAdvertisingFLStatusToggleEnabled()
  {
    return await (await this.allowNonintrusiveAdvertisingFLStatusToggle).
      isEnabled();
  }

  async isAllowNonintrusiveAdvertisingFLUpdating()
  {
    return await (await this.allowNonintrusiveAdvertisingFL).
    getAttribute("class") === "show-message";
  }

  async isAllowNonintrusiveAdvertisingFLUpdatingDone()
  {
    return await this.waitUntilAttributeValueIs(
      this.allowNonintrusiveAdvertisingFL, "class",
      "show-message", 10000, true);
  }

  async isAllowNonintrusiveAdvertisingWithoutTrackingFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.
    allowNonintrusiveAdvertisingWithoutTrackingFL);
  }

  async isCustomFilterListsFirstItemToggleSelected()
  {
    return await (await this.customFilterListsFirstItemToggle).
    getAttribute("aria-checked") === "true";
  }

  async isEasyListFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.easyListFL);
  }

  async isEasyListFLStatusToggleSelected()
  {
    return await (await this.easyListFLStatusToggle).
    getAttribute("aria-checked") === "true";
  }

  async isEasyListFLUpdating()
  {
    return await (await this.easyListFL).
    getAttribute("class") === "show-message";
  }

  async isEasyListFLUpdatingDone()
  {
    return await this.waitUntilAttributeValueIs(
      this.easyListFL, "class",
      "show-message", 10000, true);
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

  async isFilterListErrorPopoutDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.filterListErrorPopout,
                                              reverseOption);
  }

  async isFilterListsDropdownDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.filterListsDropdown,
                                              reverseOption);
  }

  async isIDontCareAboutCookiesFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.iDontCareAboutCookiesFL);
  }

  async isListeFREasyListFLDisplayed()
  {
    return await this.waitForDisplayedNoError(this.listeFREasyListFL);
  }

  async isListeFREasyListFLStatusToggleSelected()
  {
    return await (await this.listeFREasyListFLStatusToggle).
    getAttribute("aria-checked") === "true";
  }

  async isShowAdblockPlusPanelCheckboxSelected(expectedValue = "true",
                                               timeoutVal = 3000)
  {
    return await this.waitUntilAttributeValueIs(
      this.showAdblockPlusPanelCheckbox, "aria-checked",
      expectedValue, timeoutVal);
  }

  async isShowAdblockPlusPanelTooltipTextDisplayed()
  {
    return await (await this.showAdblockPlusPanelTooltipText).isDisplayed();
  }

  async isShowBlockElementCheckboxSelected(expectedValue = "true",
                                           timeoutVal = 3000)
  {
    return await this.waitUntilAttributeValueIs(
      this.showBlockElementCheckbox, "aria-checked",
      expectedValue, timeoutVal);
  }

  async isShowBlockElementTooltipTextDisplayed()
  {
    return await (await this.showBlockElementTooltipText).isDisplayed();
  }

  async isShowNumberOfAdsBlockedCheckboxSelected(expectedValue = "true",
                                                 timeoutVal = 3000)
  {
    return await this.waitUntilAttributeValueIs(
      this.showNumberOfAdsBlockedCheckbox, "aria-checked",
      expectedValue, timeoutVal);
  }

  async isShowUsefulNotificationsCheckboxSelected(expectedValue = "true",
                                                  timeoutVal = 3000)
  {
    return await this.waitUntilAttributeValueIs(
      this.showUsefulNotificationsCheckbox, "aria-checked",
      expectedValue, timeoutVal);
  }

  async isShowUsefulNotificationsTooltipTextDisplayed()
  {
    return await (await this.showUsefulNotificationsTooltipText).isDisplayed();
  }

  async isTestFilterListDisplayed()
  {
    return await (await this.testFilterList).isExisting();
  }

  async isTestFilterListNoHtttpsDisplayed()
  {
    return await (await this.testFilterListNoHtttps).isExisting();
  }

  async isTestFilterListStatusToggleSelected()
  {
    return await (await this.testFilterListStatusToggle).
    getAttribute("aria-checked") === "true";
  }

  async isTurnOnDebugElementCheckboxSelected(expectedValue = "true",
                                             timeoutVal = 3000)
  {
    return await this.waitUntilAttributeValueIs(
      this.turnOnDebugElementCheckbox, "aria-checked",
      expectedValue, timeoutVal);
  }

  async isTurnOnDebugElementTooltipTextDisplayed()
  {
    return await (await this.turnOnDebugElementTooltipText).isDisplayed();
  }

  async isUrlErrorMessageDisplayed()
  {
    return await this.waitForDisplayedNoError(this.urlErrorMessage);
  }

  async switchToEasylistSourceTab()
  {
    await this.switchToTab("https://easylist-downloads." +
    "adblockplus.org/easylist.txt");
  }

  async switchToEasylisttoTab()
  {
    await this.switchToTab("EasyList - Overview");
  }

  async switchToHowToWriteFiltersTab()
  {
    await this.switchToTab("How to write filters | Adblock Plus Help Center");
  }

  async switchToSubscriptionsTab()
  {
    await this.switchToTab("Known Adblock Plus subscriptions");
  }

  async typeTextToFilterListUrlInput(text)
  {
    await (await this.filterListUrlInput).setValue(text);
  }

  async typeTextToAddCustomFilterListInput(text)
  {
    await (await this.addCustomFilterListInput).setValue(text);
  }

  async waitForAbpFiltersFLLastUpdatedTextToEqual(text, timeoutVal = 10000)
  {
    return await this.waitUntilTextIs(this.abpFiltersFLLastUpdatedText,
                                      text, timeoutVal);
  }

  async waitForAllowNonintrusiveFLLastUpdatedTextToEqual(text,
                                                         timeoutVal = 10000)
  {
    return await this.waitUntilTextIs(
      this.allowNonintrusiveAdvertisingFLLastUpdatedText,
      text, timeoutVal);
  }

  async waitForEasyListFLLastUpdatedTextToEqual(text, timeoutVal = 10000)
  {
    return await this.waitUntilTextIs(this.easyListFLLastUpdatedText,
                                      text, timeoutVal);
  }
}

module.exports = AdvancedPage;
