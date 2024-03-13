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

// This is used for content available on any test pages
class TestPages extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get autoplayVideosBlockingFilterId()
  {
    return $("#autoplayvideo-blocking-filter");
  }

  get autoplayVideosHidingFilterId()
  {
    return $("#product-video-container");
  }

  get banneradsFilter()
  {
    return $("#bannerads-blocking-filter");
  }

  get customBlockingFilter()
  {
    return $("#custom-blocking");
  }

  get customBlockingRegexFilter()
  {
    return $("#custom-blocking-regex");
  }

  get customHidingClass()
  {
    return $("#custom-hiding-class");
  }

  get customHidingId()
  {
    return $("#custom-hiding-id");
  }

  get awe2Filter()
  {
    return $("#awe2-blocking-filter");
  }

  get ecosiaAdPill()
  {
    return $("//span[@class='ad-pill']");
  }

  get ecosiaAdPillAlternate()
  {
    return $("span*=Ad");
  }

  get hiddenBySnippetText()
  {
    return $("p*=This should be hidden by a snippet");
  }

  get newsletterPopupsBlockingFilterId()
  {
    return $("#newsletter-blocking-filter");
  }

  get newsletterPopupsHidingFilterId()
  {
    return $("#newsletterMsg");
  }

  get pushNotificationsBlockingFilterId()
  {
    return $("#pushnotifications-blocking-filter");
  }

  get pushNotificationsHidingFilterId()
  {
    return $("#pushnotifications-hiding-filter");
  }

  get searchAdDiv()
  {
    return $("#search-ad");
  }

  get snippetFilterDiv()
  {
    return $("#snippet-filter");
  }

  get subscribeLink()
  {
    return $("//*[@id='subscription-link']/a");
  }

  get subscriptionBlocking()
  {
    return $("#subscription-blocking");
  }

  get subscriptionBlockingRegex()
  {
    return $("#subscription-blocking-regex");
  }

  get subscriptionHidingClass()
  {
    return $("#subscription-hiding-class");
  }

  get subscriptionHidingId()
  {
    return $("#subscription-hiding-id");
  }

  get surveysBlockingFilterId()
  {
    return $("#survey-blocking-filter");
  }

  get surveysHidingFilterId()
  {
    return $("#survey-feedback-to-left");
  }

  get AdContainerDiv()
  {
    return $("#AdContainer");
  }

  async clickSubscribeLink()
  {
    await this.waitForEnabledThenClick(this.subscribeLink);
  }

  get cookieBanner()
  {
    return $("#cookieConsentModal");
  }

  async getCustomBlockingFilterText()
  {
    return await (await this.customBlockingFilter).getText();
  }

  async getCustomBlockingRegexFilterText()
  {
    return await (await this.customBlockingRegexFilter).getText();
  }

  async getCustomHidingClassText()
  {
    return await (await this.customHidingClass).getText();
  }

  async getCustomHidingIdText()
  {
    return await (await this.customHidingId).getText();
  }

  async getBanneradsFilterText()
  {
    return await (await this.banneradsFilter).getText();
  }

  async getAwe2FilterText()
  {
    await (await this.awe2Filter).waitForEnabled({timeout: 4000});
    return await (await this.awe2Filter).getText();
  }

  async getSearchAdDivText()
  {
    return await (await this.searchAdDiv).getText();
  }

  async getSubscriptionBlockingText()
  {
    await (await this.subscriptionBlocking).waitForEnabled({timeout: 2000});
    return await (await this.subscriptionBlocking).getText();
  }

  async getSubscriptionBlockingRegexText()
  {
    return await (await this.subscriptionBlockingRegex).getText();
  }

  async getSubscriptionHidingClassText()
  {
    return await (await this.subscriptionHidingClass).getText();
  }

  async getSubscriptionHidingIdText()
  {
    return await (await this.subscriptionHidingId).getText();
  }

  async getAdContainerDivText()
  {
    return await (await this.AdContainerDiv).getText();
  }

  async isAutoplayVideosBlockingFilterIdDisplayed()
  {
    return await (await this.autoplayVideosBlockingFilterId).isDisplayed();
  }

  async isAutoplayVideosHidingFilterIdDisplayed()
  {
    return await (await this.autoplayVideosHidingFilterId).isDisplayed();
  }

  async isCookieBannerDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      cookieBanner, reverseOption, 2000);
  }

  async isCustomHidingClassDisplayed()
  {
    return await (await this.customHidingClass).isDisplayed();
  }

  async isCustomHidingIdDisplayed()
  {
    return await (await this.customHidingId).isDisplayed();
  }

  async isEcosiaAdPillDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      ecosiaAdPill, reverseOption, 2000);
  }

  async isEcosiaAdPillAlternateDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      ecosiaAdPillAlternate, reverseOption, 2000);
  }

  async isHiddenBySnippetTextDisplayed()
  {
    return await (await this.hiddenBySnippetText).isDisplayed();
  }

  async isNewsletterPopupsBlockingFilterIdDisplayed()
  {
    return await (await this.newsletterPopupsBlockingFilterId).isDisplayed();
  }

  async isNewsletterPopupsHidingFilterIdDisplayed()
  {
    return await (await this.newsletterPopupsHidingFilterId).isDisplayed();
  }

  async isPushNotificationsBlockingFilterIdDisplayed()
  {
    return await (await this.pushNotificationsBlockingFilterId).isDisplayed();
  }

  async isPushNotificationsHidingFilterIdDisplayed()
  {
    return await (await this.pushNotificationsHidingFilterId).isDisplayed();
  }

  async isSearchAdDivDisplayed()
  {
    return await (await this.searchAdDiv).isDisplayed();
  }

  async isSubscriptionHidingClassDisplayed()
  {
    return await (await this.subscriptionHidingClass).isDisplayed();
  }

  async isSubscriptionHidingIdDisplayed()
  {
    return await (await this.subscriptionHidingId).isDisplayed();
  }

  async isSurveysBlockingFilterIdDisplayed()
  {
    return await (await this.surveysBlockingFilterId).isDisplayed();
  }

  async isSurveysHidingFilterIdDisplayed()
  {
    return await (await this.surveysHidingFilterId).isDisplayed();
  }

  async isSnippetFilterDivDisplayed()
  {
    return await (await this.snippetFilterDiv).isDisplayed();
  }

  async isAdContainerDivDisplayed()
  {
    return await (await this.AdContainerDiv).isDisplayed();
  }
}

module.exports = TestPages;
