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

  get copyCustomFLButton()
  {
    return this.browser.$("//button[@class='copy']");
  }

  get customFilterListsErrorText()
  {
    return $("//div[@class='footer visible']/ul/li");
  }

  get customFilterListsFirstItemAlertIcon()
  {
    return $("//tbody/tr[1]/td[4]/img[@src='skin/icons/alert.svg']");
  }

  get customFilterListsFirstItemErrorIcon()
  {
    return $("//tbody/tr[1]/td[4]/img[@src='skin/icons/error.svg']");
  }

  get customFilterListsFirstItemAlertText()
  {
    return $("//tbody/tr[1]/td[4]/img[contains(@title, 'Slow filter')]");
  }

  async customFilterListsNthItemCheckbox(n)
  {
    return $("//tbody/tr[" + n + "]/td[1]/io-checkbox/button");
  }

  async customFilterListsNthItemText(n)
  {
    return $("//io-filter-list/table/tbody/tr[" + n + "]/td[3]/div");
  }

  get customFilterListsFirstItemToggle()
  {
    return $("//io-filter-list/table/tbody/tr[1]/td[2]/io-toggle/button");
  }

  get customFilterListsTable()
  {
    return $("//io-filter-table");
  }

  get customFilterListsTableContent()
  {
    return $("//io-filter-list");
  }

  get customFilterListsTableRowsTexts()
  {
    return $("//io-filter-list/table").$$("//div[@class='content']");
  }

  get customFLTableHeadAlertIcon()
  {
    return this.browser.$("//io-filter-list/table/thead/tr/th[4]/img");
  }

  get customFLTableHeadArrow()
  {
    return this.browser.$("//io-filter-list/table/thead/tr/th[2]");
  }

  get customFLTableHeadCheckbox()
  {
    return this.browser.$("//io-filter-list/table/thead/tr/th[1]/" +
      "io-checkbox/button");
  }

  get customFLTableHeadFilterRule()
  {
    return this.browser.$("//io-filter-list/table/thead/tr/th[3]");
  }

  get deleteCustomFLButton()
  {
    return this.browser.$("//button[@class='delete']");
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
    await this.waitForEnabledThenClick(this.addAFilterListButton);
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
    await this.waitForEnabledThenClick(this.addNewFilterListButton);
  }

  async clickCancelAddingFLButton()
  {
    await (await this.cancelAddingFLButton).click();
  }

  async clickCopyCustomFLButton()
  {
    await (await this.copyCustomFLButton).click();
  }

  async clickCustomFilterListsNthItemCheckbox(n)
  {
    await (await this.customFilterListsNthItemCheckbox(n)).click();
  }

  async clickCustomFilterListsNthItemText(n)
  {
    await (await this.customFilterListsNthItemText(n)).click();
  }

  async clickCustomFilterListsFirstItemToggle()
  {
    await (await this.customFilterListsFirstItemToggle).click();
  }

  async clickCustomFLTableHeadAlertIcon()
  {
    await (await this.customFLTableHeadAlertIcon).click();
  }

  async clickCustomFLTableHeadArrow()
  {
    await (await this.customFLTableHeadArrow).click();
  }

  async clickCustomFLTableHeadCheckbox()
  {
    await (await this.customFLTableHeadCheckbox).click();
  }

  async clickCustomFLTableHeadFilterRule()
  {
    await (await this.customFLTableHeadFilterRule).click();
  }

  async clickDeleteCustomFLButton()
  {
    await (await this.deleteCustomFLButton).click();
  }

  async clickEasyListFLGearIcon()
  {
    await this.waitForEnabledThenClick(this.easyListFLGearIcon);
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
    await this.waitForEnabledThenClick(this.easyListFLTrashButton);
  }

  async clickEasyListFLUpdateNowButton()
  {
    await this.waitForEnabledThenClick(this.easyListFLUpdateNowButton);
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
    await this.waitForEnabledThenClick(this.
      showAdblockPlusPanelTooltipIcon);
  }

  async clickShowBlockElementCheckbox()
  {
    await (await this.showBlockElementCheckbox).click();
  }

  async clickShowBlockElementTooltipIcon()
  {
    await this.waitForEnabledThenClick(this.
      showBlockElementTooltipIcon);
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
    await this.waitForEnabledThenClick(this.
      showUsefulNotificationsTooltipIcon);
  }

  async clickTurnOnDebugElementCheckbox()
  {
    await (await this.turnOnDebugElementCheckbox).click();
  }

  async clickTurnOnDebugElementTooltipIcon()
  {
    await this.waitForEnabledThenClick(this.
      turnOnDebugElementTooltipIcon);
  }

  async clickUpdateAllFilterlistsButton()
  {
    await (await this.updateAllFilterlistsButton).click();
  }

  async getCustomFilterListsErrorText()
  {
    return await (await this.customFilterListsErrorText).getText();
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

  async isAbpFiltersFLUpdating(timeout = 5000, reverse = false)
  {
    return await this.waitUntilAttributeValueIs(
      this.abpFiltersFL, "class", "show-message", timeout, reverse);
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

  async isAddCustomFilterListButtonEnabled(reverseOption = false,
                                           timeoutMs = 3000)
  {
    return await this.waitForEnabledNoError(this.addCustomFilterListButton,
                                            reverseOption, timeoutMs);
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

  async isAllowNonintrusiveAdvertisingFLUpdating(timeout = 5000,
                                                 reverse = false)
  {
    return await this.waitUntilAttributeValueIs(
      this.allowNonintrusiveAdvertisingFL, "class", "show-message",
      timeout, reverse);
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

  async isCopyCustomFLButtonDisplayed()
  {
    return await (await this.copyCustomFLButton).isDisplayed();
  }

  async isCustomFilterListsFirstItemAlertIconDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(
      this.customFilterListsFirstItemAlertIcon,
      reverseOption);
  }

  async isCustomFilterListsFirstItemErrorIconDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(
      this.customFilterListsFirstItemErrorIcon,
      reverseOption);
  }

  async isCustomFLFirstItemAlertIconTooltipDisplayed(expectedValue = "",
                                                     timeoutVal = 5000)
  {
    expectedValue = "Slow filter. Please check the length of the pattern " +
      "and ensure it doesn't contain a regular expression.";
    await this.waitUntilAttributeValueIs(
      this.customFilterListsFirstItemAlertIcon, "title",
      expectedValue, timeoutVal);
    // Wait until tooltip is displayed
    await this.browser.pause(2500);
    return await (await this.customFilterListsFirstItemAlertText).isDisplayed();
  }

  async isCustomFilterListsNthItemCheckboxChecked(n, reverseOption = false)
  {
    return await this.waitUntilAttributeValueIs(
      this.customFilterListsNthItemCheckbox(n), "aria-checked",
      "true", 3000, reverseOption);
  }

  async isCustomFilterListsFirstItemToggleDisplayed()
  {
    return await (await this.customFilterListsFirstItemToggle).isDisplayed();
  }

  async isCustomFilterListsFirstItemToggleSelected(reverseOption = false)
  {
    return await this.waitUntilAttributeValueIs(
      this.customFilterListsFirstItemToggle, "aria-checked",
      "true", 3000, reverseOption);
  }

  async isCustomFilterListsTableDisplayed()
  {
    return await (await this.customFilterListsTable).isDisplayed();
  }

  async isCustomFilterListsTableContentDisplayed()
  {
    return await (await this.customFilterListsTableContent).isDisplayed();
  }

  async isDeleteCustomFLButtonDisplayed()
  {
    return await (await this.deleteCustomFLButton).isDisplayed();
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
    return await this.waitUntilAttributeValueIs(
      this.easyListFL, "class", "show-message");
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

  async isListeFREasyListFLStatusToggleSelected(expectedValue = "true",
                                                timeoutVal = 3000)
  {
    return await this.waitUntilAttributeValueIs(
      this.listeFREasyListFLStatusToggle, "aria-checked",
      expectedValue, timeoutVal);
  }

  async isShowAdblockPlusPanelCheckboxSelected(expectedValue = "true",
                                               timeoutVal = 3000)
  {
    return await this.waitUntilAttributeValueIs(
      this.showAdblockPlusPanelCheckbox, "aria-checked",
      expectedValue, timeoutVal);
  }

  async isShowAdblockPlusPanelTooltipTextDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      showAdblockPlusPanelTooltipText, reverseOption);
  }

  async isShowBlockElementCheckboxSelected(expectedValue = "true",
                                           timeoutVal = 3000)
  {
    return await this.waitUntilAttributeValueIs(
      this.showBlockElementCheckbox, "aria-checked",
      expectedValue, timeoutVal);
  }

  async isShowBlockElementTooltipTextDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      showBlockElementTooltipText, reverseOption);
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

  async isShowUsefulNotificationsTooltipTextDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      showUsefulNotificationsTooltipText, reverseOption);
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

  async isTurnOnDebugElementTooltipTextDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      turnOnDebugElementTooltipText, reverseOption);
  }

  async isUrlErrorMessageDisplayed()
  {
    return await this.waitForDisplayedNoError(this.urlErrorMessage);
  }

  async hoverCustomFilterListsFirstItemAlertIcon()
  {
    await (await this.customFilterListsFirstItemAlertIcon).scrollIntoView();
    await (await this.customFilterListsFirstItemAlertIcon).moveTo();
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
    await (await this.filterListUrlInput).click();
    await this.browser.keys(text);
  }

  async typeTextToAddCustomFilterListInput(text)
  {
    await (await this.addCustomFilterListInput).click();
    await (await this.addCustomFilterListInput).clearValue();
    await this.browser.keys(text);
  }

  async verifyTextPresentInCustomFLTable(text, timeoutVal = 3000)
  {
    let waitTime = 0;
    while (waitTime <= timeoutVal)
    {
      for (const element of (await this.customFilterListsTableRowsTexts))
      {
        await element.scrollIntoView();
        if (await element.getText() == text)
        {
          return true;
        }
        await this.browser.pause(200);
        waitTime += 200;
      }
    }
    if (waitTime >= timeoutVal)
    {
      return false;
    }
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

  async waitForCustomFilterListsNthItemTextToEqual(text, n,
                                                   timeoutVal = 5000)
  {
    return await this.waitUntilTextIs(
      this.customFilterListsNthItemText(n),
      text, timeoutVal);
  }

  async waitForEasyListFLLastUpdatedTextToEqual(text, timeoutVal = 10000)
  {
    return await this.waitUntilTextIs(this.easyListFLLastUpdatedText,
                                      text, timeoutVal);
  }
}

module.exports = AdvancedPage;
