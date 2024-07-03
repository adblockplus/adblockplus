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

class GeneralPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get _generalTabButton()
  {
    return $("//a[contains(@data-i18n, 'options_tab_general')" +
        "and text()='General']");
  }

  async init()
  {
    await (await this._generalTabButton).click();
  }

  get acceptableAdsCriteriaLink()
  {
    return $("//*[@id='enable-acceptable-ads-description']/a");
  }

  get acceptableAdsLearnMoreLink()
  {
    return $("//a[contains(@data-doclink, 'privacy_friendly_ads')" +
        "and text()='Learn more']");
  }

  get addALanguageButton()
  {
    return $("#languages-boxlabel");
  }

  get addPredefinedSubscriptionButton()
  {
    return $("//button[@data-action='add-predefined-subscription']");
  }

  get allowAcceptableAdsCheckbox()
  {
    return $("#acceptable-ads-allow");
  }

  get blockAdditionalTrackingCheckbox()
  {
    return $("//li[@aria-label='Block additional tracking']/button");
  }

  get blockAdditionalTrackingDescription()
  {
    return $("//li[@aria-label='Block additional tracking']/" +
      "div[@class='description-container']/p");
  }

  get blockCookieConsentPopupsDialog()
  {
    return $("#dialog-content-optIn-premium-subscription");
  }

  get blockCookieConsentPopupsDialogText()
  {
    return $("//*[@id='dialog-content-optIn-premium-subscription']/p");
  }

  get blockCookieConsentPopupsDialogNoButton()
  {
    return $("//*[@id='dialog-content-optIn-premium-subscription']/" +
      "div/button[@data-action='close-dialog']");
  }

  get blockCookieConsentPopupsDialogOkButton()
  {
    return $("//button[@data-action='add-subscription']");
  }

  get blockCookieConsentPopupsCheckbox()
  {
    return $("//li[@aria-label='Block cookie consent pop-ups']/button");
  }

  get blockCookieConsentPopupsItem()
  {
    return $("//li[@aria-label='Block cookie consent pop-ups']");
  }

  get blockMoreDistractionsCheckbox()
  {
    return $("//li[@aria-label='Block more distractions']/button");
  }

  get blockMoreDistractionsItem()
  {
    return $("//li[@aria-label='Block more distractions']");
  }

  get deutschPlusEnglishListItem()
  {
    return $("//li[contains(@role, 'option')" +
        "and text()='Deutsch + English']");
  }

  get filterListsSuggestionsCheckbox()
  {
    return $("//li[@data-pref='recommend_language_subscriptions']/button");
  }

  get blockPushNotificationsCheckbox()
  {
    return $("//li[@aria-label='Block push notifications']/button");
  }

  get blockPushNotificationsDescription()
  {
    return $("//li[@aria-label='Block push notifications']/" +
    "div[@class='description-container']/p");
  }

  get blockSocialMediaIconsTrackingCheckbox()
  {
    return $("//li[@aria-label='Block social media icons tracking']/button");
  }

  get blockSocialMediaIconsTrackingDescription()
  {
    return $("//li[@aria-label='Block social media icons tracking']/" +
    "div[@class='description-container']/p");
  }

  get contributeButton()
  {
    return $("//a[@data-i18n='options_footer_contribute']");
  }

  get doNotTrackNoteParagraph()
  {
    return $("#dnt");
  }

  get deutschPlusEnglischLanguageTableItem()
  {
    return $("//li[@aria-label='Deutsch + Englisch']");
  }

  get deutschPlusEnglishLanguageTableItem()
  {
    return $("//li[@aria-label='Deutsch + English']");
  }

  get deutschPlusEnglishLanguageTrashIcon()
  {
    return $("//li[@aria-label='Deutsch + English']/button[@title='remove']");
  }

  get englishLanguageChangeButton()
  {
    return $("//li[@aria-label='English']/" +
      "button[@data-dialog='language-change']");
  }

  get englishLanguageTableItem()
  {
    return $("//li[@aria-label='English']");
  }

  get englishLanguageTrashIcon()
  {
    return $("//li[@aria-label='English']/button[@title='remove']");
  }

  get italianoPlusEnglishLanguageTableItem()
  {
    return $("//li[@aria-label='italiano + English']");
  }

  get italianoPlusEnglishListItem()
  {
    return $("//li[contains(@role, 'option')" +
        "and text()='italiano + English']");
  }

  get languagesDropdown()
  {
    return $("#languages-boxpopup");
  }

  get languagesTableEmptyPlaceholder()
  {
    return $("//*[@id='blocking-languages-table']" +
      "/li[@class='empty-placeholder']");
  }

  get listeFRPlusEasylistLanguageTableItem()
  {
    return $("//li[@aria-label='français + English']");
  }

  get moreFilterListsTable()
  {
    return $("#more-list-table");
  }

  async moreFilterListsTableItemByLabel(label)
  {
    return $("//ul[@id='more-list-table']/li[@aria-label" +
    "='" + label + "']/span");
  }

  get nederlandsPlusEnglishListItem()
  {
    return $("//li[contains(@role, 'option')" +
        "and text()='Nederlands + English']");
  }

  get notifyLanguageFilterListsCheckbox()
  {
    return $("//ul[@id='language-recommend']/li/button");
  }

  get notifyLanguageFilterListsTooltipIcon()
  {
    return $("//li[@data-pref='recommend_language_subscriptions']" +
        "/io-popout");
  }

  get notifyLanguageFilterListsTooltipText()
  {
    return $("//li[@data-pref='recommend_language_subscriptions']" +
        "/io-popout/div/div/p");
  }

  get okGotItTrackingWarningButton()
  {
    return $("//button[@data-i18n='options_tracking_warning_acknowledgment']");
  }

  get onlyAllowAdsWithoutTrackingCheckbox()
  {
    return $("#acceptable-ads-privacy-allow");
  }

  get predefinedDialogTitle()
  {
    return $("#dialog-title-predefined");
  }

  get premiumSectionHeader()
  {
    return $("//header[@class='premium list-header']");
  }

  get tabTitle()
  {
    return $("//h1[@data-i18n='options_tab_general']");
  }

  get trackingWarning()
  {
    return $("#tracking-warning");
  }

  get upgradeButtonGeneral()
  {
    return $("//header/a[@data-i18n='options_upgrade_button']");
  }

  get yesUseThisFLButton()
  {
    return $("//button[@data-action='add-predefined-subscription']");
  }

  async clickAcceptableAdsCriteriaLink()
  {
    await (await this.acceptableAdsCriteriaLink).click();
  }

  async clickAcceptableAdsLearnMoreLink()
  {
    await (await this.acceptableAdsLearnMoreLink).click();
  }

  async clickAddALanguageButton()
  {
    await (await this.addALanguageButton).click();
  }

  async clickAddPredefinedSubscriptionButton()
  {
    await (await this.addPredefinedSubscriptionButton).click();
  }

  async clickAllowAcceptableAdsCheckbox()
  {
    await this.waitForEnabledThenClick(this.
      allowAcceptableAdsCheckbox);
  }

  async clickBlockAdditionalTrackingCheckbox()
  {
    await this.waitForEnabledThenClick(this.
      blockAdditionalTrackingCheckbox);
  }

  async clickBlockCookieConsentPopupsDialogNoButton()
  {
    await this.waitForEnabledThenClick(this.
      blockCookieConsentPopupsDialogNoButton);
  }

  async clickBlockCookieConsentPopupsDialogOkButton()
  {
    await this.waitForEnabledThenClick(this.
      blockCookieConsentPopupsDialogOkButton);
  }

  async clickBlockCookieConsentPopupsCheckbox()
  {
    await this.waitForEnabledThenClick(this.
      blockCookieConsentPopupsCheckbox);
  }

  async clickBlockMoreDistractionsCheckbox()
  {
    await this.waitForEnabledThenClick(this.
      blockMoreDistractionsCheckbox);
  }

  async clickBlockPushNotificationsCheckbox()
  {
    await (await this.blockPushNotificationsCheckbox).click();
  }

  async clickBlockSocialMediaIconsTrackingCheckbox()
  {
    await (await this.blockSocialMediaIconsTrackingCheckbox).click();
  }

  async clickContributeButton()
  {
    await (await this.contributeButton).click();
  }

  async clickDeutschPlusEnglishListItem()
  {
    await this.scrollIntoViewAndClick(this.deutschPlusEnglishListItem);
  }

  async clickDeutschPlusEnglishLanguageTrashIcon()
  {
    await this.scrollIntoViewAndClick(this.
      deutschPlusEnglishLanguageTrashIcon);
  }

  async clickEnglishLanguageChangeButton()
  {
    await (await this.englishLanguageChangeButton).click();
  }

  async clickFilterListsSuggestionsCheckbox()
  {
    await (await this.filterListsSuggestionsCheckbox).click();
  }

  async clickItalianoPlusEnglishListItem()
  {
    await (await this.italianoPlusEnglishListItem).click();
  }

  async clickNederlandsPlusEnglishListItem()
  {
    await (await this.nederlandsPlusEnglishListItem).click();
  }

  async clickNotifyLanguageFilterListsCheckbox()
  {
    await (await this.notifyLanguageFilterListsCheckbox).click();
  }

  async clickNotifyLanguageFilterListsTooltipIcon()
  {
    await (await this.notifyLanguageFilterListsTooltipIcon).click();
  }

  async clickOnlyAllowAdsWithoutTrackingCheckbox()
  {
    await this.waitForEnabledThenClick(this.
      onlyAllowAdsWithoutTrackingCheckbox);
  }

  async clickOkGotItTrackingWarningButton()
  {
    await (await this.okGotItTrackingWarningButton).click();
  }

  async clickUpgradeButtonGeneral()
  {
    await this.waitForEnabledThenClick(this.
      upgradeButtonGeneral);
  }

  async clickYesUseThisFLButton()
  {
    await this.waitForEnabledThenClick(this.yesUseThisFLButton);
  }

  async getBlockAdditionalTrackingDescriptionText()
  {
    return await (await this.blockAdditionalTrackingDescription).getText();
  }

  async getBlockCookieConsentPopupsDialogText()
  {
    return await (await this.blockCookieConsentPopupsDialogText).getText();
  }

  async getBlockPushNotificationsDescriptionText()
  {
    return await (await this.blockPushNotificationsDescription).getText();
  }

  async getBlockSocialMediaIconsTrackingDescriptionText()
  {
    return await (await
    this.blockSocialMediaIconsTrackingDescription).getText();
  }

  async getLanguagesTableEmptyPlaceholderText()
  {
    await (await this.languagesTableEmptyPlaceholder).
      waitForEnabled({timeout: 3000});
    return await (await this.languagesTableEmptyPlaceholder).getText();
  }

  async getMoreFilterListsTableItemByLabelText(label)
  {
    return await (await
    this.moreFilterListsTableItemByLabel(label)).getText();
  }

  async getNotifyLanguageFilterListsTooltipText()
  {
    return await (await
    this.notifyLanguageFilterListsTooltipText).getText();
  }

  async getPredefinedDialogTitleText()
  {
    await (await this.predefinedDialogTitle).
      waitForEnabled({timeout: 3000});
    return await (await this.predefinedDialogTitle).getText();
  }

  async getTabTitleText()
  {
    return await (await this.tabTitle).getText();
  }

  async isAllowAcceptableAdsCheckboxSelected(reverse = false, timeoutMs = 5000)
  {
    await (await this.allowAcceptableAdsCheckbox).
      waitForEnabled({timeout: 3000});
    return await this.waitForSelectedNoError(this.
      allowAcceptableAdsCheckbox, reverse, timeoutMs);
  }

  async isBlockAdditionalTrackingCheckboxSelected(reverse = false)
  {
    await (await this.blockAdditionalTrackingCheckbox).
      waitForEnabled({timeout: 3000});
    return await this.waitUntilAttributeValueIs(
      this.blockAdditionalTrackingCheckbox, "aria-checked", "true",
      3000, reverse);
  }

  async isBlockCookieConsentPopupsCheckboxEnabled()
  {
    return await (await this.blockCookieConsentPopupsCheckbox).isEnabled();
  }

  async isBlockCookieConsentPopupsCheckboxSelected(reverse = false)
  {
    await (await this.blockCookieConsentPopupsCheckbox).
      waitForEnabled({timeout: 3000});
    return await this.waitUntilAttributeValueIs(
      this.blockCookieConsentPopupsCheckbox, "aria-checked", "true",
      3000, reverse);
  }

  async isBlockCookieConsentPopupsDialogDisplayed()
  {
    return await (await this.blockCookieConsentPopupsDialog).isDisplayed();
  }

  async isBlockCookieConsentPopupsItemDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      blockCookieConsentPopupsItem, reverseOption);
  }

  async isBlockMoreDistractionsCheckboxEnabled()
  {
    return await (await this.blockMoreDistractionsCheckbox).isEnabled();
  }

  async isBlockMoreDistractionsCheckboxSelected(reverse = false)
  {
    await (await this.blockMoreDistractionsCheckbox).
      waitForEnabled({timeout: 3000});
    return await this.waitUntilAttributeValueIs(
      this.blockMoreDistractionsCheckbox, "aria-checked", "true",
      3000, reverse);
  }

  async isBlockMoreDistractionsItemDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      blockMoreDistractionsItem, reverseOption);
  }

  async isBlockPushNotificationsCheckboxSelected(reverse = false)
  {
    await (await this.blockPushNotificationsCheckbox).
      waitForEnabled({timeout: 3000});
    return await this.waitUntilAttributeValueIs(
      this.blockPushNotificationsCheckbox, "aria-checked", "true",
      3000, reverse);
  }

  async isBlockSocialMediaIconsTrackingCheckboxSelected(reverse = false)
  {
    await (await this.blockSocialMediaIconsTrackingCheckbox).
      waitForEnabled({timeout: 3000});
    return await this.waitUntilAttributeValueIs(
      this.blockSocialMediaIconsTrackingCheckbox, "aria-checked", "true",
      3000, reverse);
  }

  async isDeutschPlusEnglischLanguageTableItemDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      deutschPlusEnglischLanguageTableItem, reverseOption);
  }

  async isDeutschPlusEnglishLanguageTableItemDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      deutschPlusEnglishLanguageTableItem, reverseOption);
  }

  async isDeutschPlusEnglishLanguageTrashIconDisplayed()
  {
    return await (await this.deutschPlusEnglishLanguageTrashIcon).
    isDisplayed();
  }

  async isDoNotTrackNoteParagraphDisplayed()
  {
    return await (await this.doNotTrackNoteParagraph).isDisplayed();
  }

  async isEnglishLanguageChangeButtonDisplayed()
  {
    return await this.waitForDisplayedNoError(this.
      englishLanguageChangeButton);
  }

  async isEnglishLanguageTableItemDisplayed(reverse = false)
  {
    return await this.waitForDisplayedNoError(this.
      englishLanguageTableItem, reverse);
  }

  async isEnglishLanguageTrashIconDisplayed()
  {
    return await (await this.englishLanguageTrashIcon).isDisplayed();
  }

  async isFilterListsSuggestionsCheckboxSelected(timeout = 5000,
                                                 reverse = false)
  {
    return await this.waitUntilAttributeValueIs(
      this.filterListsSuggestionsCheckbox, "aria-checked", "true",
      timeout, reverse);
  }

  async isItalianoPlusEnglishLanguageTableItemDisplayed(wait = false)
  {
    let returnValue = null;
    if (!wait)
    {
      returnValue = await (await this.italianoPlusEnglishLanguageTableItem).
      isDisplayed();
    }
    else
    {
      returnValue = await this.waitForDisplayedNoError(this.
        italianoPlusEnglishLanguageTableItem);
    }
    return returnValue;
  }

  async isLanguagesDropdownDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      languagesDropdown, reverseOption);
  }

  async isListeFRPlusEasylistLanguageTableItemDisplayed()
  {
    return await (await this.listeFRPlusEasylistLanguageTableItem).
    isDisplayed();
  }

  async isNotifyLanguageFilterListsCheckboxDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      notifyLanguageFilterListsCheckbox, reverseOption);
  }

  async isNotifyLanguageFilterListsTooltipTextDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      notifyLanguageFilterListsTooltipText, reverseOption);
  }

  async isOnlyAllowAdsWithoutTrackingCheckboxEnabled()
  {
    return await (await this.onlyAllowAdsWithoutTrackingCheckbox).
    getAttribute("aria-disabled") == "false";
  }

  async isOnlyAllowAdsWithoutTrackingCheckboxSelected(reverse = false)
  {
    await (await this.onlyAllowAdsWithoutTrackingCheckbox).
      waitForEnabled({timeout: 3000});
    return await this.waitForSelectedNoError(this.
      onlyAllowAdsWithoutTrackingCheckbox, reverse);
  }

  async isPremiumSectionHeaderDisplayed()
  {
    return await this.waitForDisplayedNoError(this.premiumSectionHeader);
  }

  async isTrackingWarningDisplayed()
  {
    return await this.waitForDisplayedNoError(this.trackingWarning);
  }

  async isTrackingWarningNotDisplayed()
  {
    return await this.waitForDisplayedNoError(this.
      trackingWarning, true);
  }

  async isUpgradeButtonGeneralDisplayed(timeout)
  {
    return await this.waitForDisplayedNoError(
      this.upgradeButtonGeneral, false, timeout);
  }

  async switchToAACriteriaTab()
  {
    await this.switchToTab(/https:\/\/adblockplus\.org\/en\/acceptable-ads#criteria.*/);
  }

  async switchToAAInfoTab()
  {
    await this.switchToTab("https://adblockplus.org/acceptable-" +
      "ads#privacy-friendly-acceptable-ads");
  }

  async switchToInstalledTab()
  {
    const title = /Adblock Plus has been installed!|Installation Successful!/;
    await this.switchToTab(title);
  }

  async switchToUninstalledTab()
  {
    await this.switchToTab("Adblock Plus has been uninstalled");
  }
}

module.exports = GeneralPage;
