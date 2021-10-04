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
    return this.browser
      .$("//a[contains(@data-i18n, 'options_tab_general')" +
        "and text()='General']");
  }

  async init()
  {
    await (await this._generalTabButton).click();
  }

  get acceptableAdsCriteriaLink()
  {
    return this.browser
      .$("//*[@id='enable-acceptable-ads-description']/a");
  }

  get acceptableAdsLearnMoreLink()
  {
    return this.browser
      .$("//a[contains(@data-doclink, 'privacy_friendly_ads')" +
        "and text()='Learn more']");
  }

  get allowAcceptableAdsCheckbox()
  {
    return this.browser
      .$("#acceptable-ads-allow");
  }

  get blockAdditionalTrackingCheckbox()
  {
    return this.browser
      .$("//li[@aria-label='Block additional tracking']/button");
  }

  get blockAdditionalTrackingTooltipIcon()
  {
    return this.browser
      .$("//li[@aria-label='Block additional tracking']/io-popout");
  }

  get blockAdditionalTrackingTooltipText()
  {
    return this.browser
      .$("//li[@aria-label='Block additional tracking']/io-popout/div/div/p");
  }

  get blockCookieWarningsCheckbox()
  {
    return this.browser
      .$("//li[@aria-label='Block cookie warnings']/button");
  }

  get blockCookieWarningsTooltipIcon()
  {
    return this.browser
      .$("//li[@aria-label='Block cookie warnings']/io-popout");
  }

  get blockCookieWarningsTooltipText()
  {
    return this.browser
      .$("//li[@aria-label='Block cookie warnings']/io-popout/div/div/p");
  }

  get blockPushNotificationsCheckbox()
  {
    return this.browser
      .$("//li[@aria-label='Block push notifications']/button");
  }

  get blockPushNotificationsTooltipIcon()
  {
    return this.browser
      .$("//li[@aria-label='Block push notifications']/io-popout");
  }

  get blockPushNotificationsTooltipText()
  {
    return this.browser
      .$("//li[@aria-label='Block push notifications']/io-popout/div/div/p");
  }

  get blockSocialMediaIconsTrackingTooltipIcon()
  {
    return this.browser
      .$("//li[@aria-label='Block social media icons tracking']/io-popout");
  }

  get blockSocialMediaIconsTrackingCheckbox()
  {
    return this.browser
      .$("//li[@aria-label='Block social media icons tracking']/button");
  }

  get blockSocialMediaIconsTrackingTooltipText()
  {
    return this.browser
      .$("//li[@aria-label='Block social media icons tracking']" +
        "/io-popout/div/div/p");
  }

  get doNotTrackNoteParagraph()
  {
    return this.browser
      .$("#dnt");
  }

  get notifyLanguageFilterListsTooltipIcon()
  {
    return this.browser
      .$("//li[@data-pref='recommend_language_subscriptions']" +
        "/io-popout");
  }

  get notifyLanguageFilterListsTooltipText()
  {
    return this.browser
      .$("//li[@data-pref='recommend_language_subscriptions']" +
        "/io-popout/div/div/p");
  }

  get okGotItTrackingWarningButton()
  {
    return this.browser
      .$("//button[@data-i18n='options_tracking_warning_acknowledgment']");
  }

  get onlyAllowAdsWithoutTrackingCheckbox()
  {
    return this.browser
      .$("#acceptable-ads-privacy-allow");
  }

  get trackingWarning()
  {
    return this.browser
      .$("#tracking-warning");
  }

  async clickAcceptableAdsCriteriaLink()
  {
    await (await this.acceptableAdsCriteriaLink).click();
  }

  async clickAcceptableAdsLearnMoreLink()
  {
    await (await this.acceptableAdsLearnMoreLink).click();
  }

  async clickAllowAcceptableAdsCheckbox()
  {
    await (await this.allowAcceptableAdsCheckbox).click();
  }

  async clickBlockAdditionalTrackingCheckbox()
  {
    await (await this.blockAdditionalTrackingCheckbox).click();
  }

  async clickBlockAdditionalTrackingTooltipIcon()
  {
    await (await this.blockAdditionalTrackingTooltipIcon).click();
  }

  async clickBlockCookieWarningsCheckbox()
  {
    await (await this.blockCookieWarningsCheckbox).click();
  }

  async clickBlockCookieWarningsTooltipIcon()
  {
    await (await this.blockCookieWarningsTooltipIcon).click();
  }

  async clickBlockPushNotificationsCheckbox()
  {
    await (await this.blockPushNotificationsCheckbox).click();
  }

  async clickBlockPushNotificationsTooltipIcon()
  {
    await (await this.blockPushNotificationsTooltipIcon).click();
  }

  async clickBlockSocialMediaIconsTrackingCheckbox()
  {
    await (await this.blockSocialMediaIconsTrackingCheckbox).click();
  }

  async clickBlockSocialMediaIconsTrackingTooltipIcon()
  {
    await (await this.blockSocialMediaIconsTrackingTooltipIcon).click();
  }

  async clickNotifyLanguageFilterListsTooltipIcon()
  {
    await (await this.notifyLanguageFilterListsTooltipIcon).click();
  }

  async clickOnlyAllowAdsWithoutTrackingCheckbox()
  {
    await (await this.onlyAllowAdsWithoutTrackingCheckbox).click();
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

  async getNotifyLanguageFilterListsTooltipText()
  {
    return await (await
    this.notifyLanguageFilterListsTooltipText).getText();
  }

  async isAllowAcceptableAdsCheckboxSelected()
  {
    return await (await this.allowAcceptableAdsCheckbox).
    getAttribute("aria-checked") === "true";
  }

  async isBlockAdditionalTrackingCheckboxSelected()
  {
    return await (await this.blockAdditionalTrackingCheckbox).
    getAttribute("aria-checked") === "true";
  }

  async isBlockAdditionalTrackingTooltipTextDisplayed()
  {
    return await (await this.blockAdditionalTrackingTooltipText).isDisplayed();
  }

  async isBlockCookieWarningsCheckboxSelected()
  {
    return await (await this.blockCookieWarningsCheckbox).
    getAttribute("aria-checked") === "true";
  }

  async isBlockCookieWarningsTooltipTextDisplayed()
  {
    return await (await this.blockCookieWarningsTooltipText).isDisplayed();
  }

  async isBlockPushNotificationsCheckboxSelected()
  {
    return await (await this.blockPushNotificationsCheckbox).
    getAttribute("aria-checked") === "true";
  }

  async isBlockPushNotificationsTooltipTextDisplayed()
  {
    return await (await this.blockPushNotificationsTooltipText).isDisplayed();
  }

  async isBlockSocialMediaIconsTrackingCheckboxSelected()
  {
    return await (await this.blockSocialMediaIconsTrackingCheckbox).
    getAttribute("aria-checked") === "true";
  }

  async isBlockSocialMediaIconsTrackingTooltipTextDisplayed()
  {
    return await (await this.blockSocialMediaIconsTrackingTooltipText).
      isDisplayed();
  }

  async isDoNotTrackNoteParagraphDisplayed()
  {
    return await (await this.doNotTrackNoteParagraph).isDisplayed();
  }

  async isNotifyLanguageFilterListsTooltipTextDisplayed()
  {
    return await (await this.notifyLanguageFilterListsTooltipText).
      isDisplayed();
  }

  async isOnlyAllowAdsWithoutTrackingCheckboxEnabled()
  {
    return await (await this.onlyAllowAdsWithoutTrackingCheckbox).
    getAttribute("aria-disabled") === "false";
  }

  async isOnlyAllowAdsWithoutTrackingCheckboxSelected()
  {
    return await (await this.onlyAllowAdsWithoutTrackingCheckbox).
    getAttribute("aria-checked") === "true";
  }

  async isTrackingWarningDisplayed()
  {
    return await (await this.trackingWarning).isDisplayed();
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
