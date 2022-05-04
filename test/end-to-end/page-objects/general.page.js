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

  get blockAdditionalTrackingTooltipIcon()
  {
    return $("//li[@aria-label='Block additional tracking']/io-popout");
  }

  get blockAdditionalTrackingTooltipText()
  {
    return $("//li[@aria-label='Block additional tracking']" +
      "/io-popout/div/div/p");
  }

  get blockCookieWarningsCheckbox()
  {
    return $("//li[@aria-label='Block cookie warnings']/button");
  }

  get blockCookieWarningsTooltipIcon()
  {
    return $("//li[@aria-label='Block cookie warnings']/io-popout");
  }

  get blockCookieWarningsTooltipText()
  {
    return $("//li[@aria-label='Block cookie warnings']/io-popout/div/div/p");
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

  get blockPushNotificationsTooltipIcon()
  {
    return $("//li[@aria-label='Block push notifications']/io-popout");
  }

  get blockPushNotificationsTooltipText()
  {
    return $("//li[@aria-label='Block push notifications']" +
      "/io-popout/div/div/p");
  }

  get blockSocialMediaIconsTrackingTooltipIcon()
  {
    return $("//li[@aria-label='Block social media icons tracking']/io-popout");
  }

  get blockSocialMediaIconsTrackingCheckbox()
  {
    return $("//li[@aria-label='Block social media icons tracking']/button");
  }

  get blockSocialMediaIconsTrackingTooltipText()
  {
    return $("//li[@aria-label='Block social media icons tracking']" +
        "/io-popout/div/div/p");
  }

  get doNotTrackNoteParagraph()
  {
    return $("#dnt");
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

  get nederlandsPlusEnglishListItem()
  {
    return $("//li[contains(@role, 'option')" +
        "and text()='Nederlands + English']");
  }

  get notifyLanguageFilterListsTooltipCheckbox()
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

  get trackingWarning()
  {
    return $("#tracking-warning");
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

  async clickBlockAdditionalTrackingTooltipIcon()
  {
    await this.waitForEnabledThenClick(this.
      blockAdditionalTrackingTooltipIcon);
  }

  async clickBlockCookieWarningsCheckbox()
  {
    await this.waitForEnabledThenClick(this.
      blockCookieWarningsCheckbox);
  }

  async clickBlockCookieWarningsTooltipIcon()
  {
    await this.waitForEnabledThenClick(this.
      blockCookieWarningsTooltipIcon);
  }

  async clickBlockPushNotificationsCheckbox()
  {
    await (await this.blockPushNotificationsCheckbox).click();
  }

  async clickBlockPushNotificationsTooltipIcon()
  {
    await this.waitForEnabledThenClick(this.
      blockPushNotificationsTooltipIcon);
  }

  async clickBlockSocialMediaIconsTrackingCheckbox()
  {
    await (await this.blockSocialMediaIconsTrackingCheckbox).click();
  }

  async clickBlockSocialMediaIconsTrackingTooltipIcon()
  {
    await this.waitForEnabledThenClick(this.
      blockSocialMediaIconsTrackingTooltipIcon);
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

  async clickNotifyLanguageFilterListsTooltipCheckbox()
  {
    await (await this.notifyLanguageFilterListsTooltipCheckbox).click();
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

  async getBlockAdditionalTrackingTooltipText()
  {
    return await (await this.blockAdditionalTrackingTooltipText).getText();
  }

  async getBlockCookieWarningsTooltipText()
  {
    return await (await this.blockCookieWarningsTooltipText).getText();
  }

  async getBlockPushNotificationsTooltipText()
  {
    return await (await this.blockPushNotificationsTooltipText).getText();
  }

  async getBlockSocialMediaIconsTrackingTooltipText()
  {
    return await (await
    this.blockSocialMediaIconsTrackingTooltipText).getText();
  }

  async getLanguagesTableEmptyPlaceholderText()
  {
    await (await this.languagesTableEmptyPlaceholder).
      waitForEnabled({timeout: 3000});
    return await (await this.languagesTableEmptyPlaceholder).getText();
  }

  async getNotifyLanguageFilterListsTooltipText()
  {
    return await (await
    this.notifyLanguageFilterListsTooltipText).getText();
  }

  async getPredefinedDialogTitleText()
  {
    return await (await this.predefinedDialogTitle).getText();
  }

  async isAllowAcceptableAdsCheckboxSelected(reverse = false)
  {
    await (await this.allowAcceptableAdsCheckbox).
      waitForEnabled({timeout: 3000});
    return await this.waitUntilAttributeValueIs(
      this.allowAcceptableAdsCheckbox, "aria-checked", "true",
      3000, reverse);
  }

  async isBlockAdditionalTrackingCheckboxSelected(reverse = false)
  {
    await (await this.blockAdditionalTrackingCheckbox).
      waitForEnabled({timeout: 3000});
    return await this.waitUntilAttributeValueIs(
      this.blockAdditionalTrackingCheckbox, "aria-checked", "true",
      3000, reverse);
  }

  async isBlockAdditionalTrackingTooltipTextDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      blockAdditionalTrackingTooltipText, reverseOption);
  }

  async isBlockCookieWarningsCheckboxSelected()
  {
    return await (await this.blockCookieWarningsCheckbox).
      getAttribute("aria-checked") === "true";
  }

  async isBlockCookieWarningsTooltipTextDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      blockCookieWarningsTooltipText, reverseOption);
  }

  async isBlockPushNotificationsCheckboxSelected()
  {
    return await (await this.blockPushNotificationsCheckbox).
      getAttribute("aria-checked") === "true";
  }

  async isBlockPushNotificationsTooltipTextDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      blockPushNotificationsTooltipText, reverseOption);
  }

  async isBlockSocialMediaIconsTrackingCheckboxSelected()
  {
    return await (await this.blockSocialMediaIconsTrackingCheckbox).
    getAttribute("aria-checked") === "true";
  }

  async isBlockSocialMediaIconsTrackingTooltipTextDisplayed(reverseOption =
  false)
  {
    return await this.waitForDisplayedNoError(this.
      blockSocialMediaIconsTrackingTooltipText, reverseOption);
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

  async isNotifyLanguageFilterListsTooltipTextDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      notifyLanguageFilterListsTooltipText, reverseOption);
  }

  async isOnlyAllowAdsWithoutTrackingCheckboxEnabled()
  {
    return await (await this.onlyAllowAdsWithoutTrackingCheckbox).
    getAttribute("aria-disabled") === "false";
  }

  async isOnlyAllowAdsWithoutTrackingCheckboxSelected(reverse = false)
  {
    return await this.waitUntilAttributeValueIs(
      this.onlyAllowAdsWithoutTrackingCheckbox, "aria-checked", "true",
      3000, reverse);
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

  async switchToAAInfoTab()
  {
    await this.switchToTab("Allowing acceptable ads in Adblock Plus");
  }
}

module.exports = GeneralPage;
