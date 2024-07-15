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
const {isFirefox} = require("../helpers");

class PopupPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  async init(origin, tabId)
  {
    await browser.newWindow("about:blank");
    await browser.url(
      `${origin}/popup.html?testTabId=${tabId}`
    );
    await (await this.pageStatsCounter).waitForExist({timeout: 10000});
  }

  get blockCookieConsentPopupsTitle()
  {
    return $("//div[@id='page-premium-cta']/a/" +
      "span[@data-i18n='premium_cookies_title']");
  }

  get blockCookieConsentPopupsPremiumTitle()
  {
    return $("//div[@id='page-premium-controls']/article" +
      "/div/span[@data-i18n='premium_cookies_title']");
  }

  get blockCookieConsentPopupsToggle()
  {
    return $("//io-circle-toggle[@id='premium-cookie-toggle']" +
      "//*[@role='checkbox']");
  }

  get blockMoreDistractionsTitle()
  {
    return $("//div[@id='page-premium-cta']/a/" +
      "span[@data-i18n='premium_distractions_title']");
  }

  get blockMoreDistractionsPremiumTitle()
  {
    return $("//div[@id='page-premium-controls']/article" +
      "/div/span[@data-i18n='premium_distractions_title']");
  }

  get blockMoreDistractionsToggle()
  {
    return $("//io-circle-toggle[@id='premium-distractions-toggle']" +
    "//*[@role='checkbox']");
  }

  get closeNotificationButton()
  {
    return $("//button[contains(.,'Close')]");
  }

  get cookieConsentPopupsPopup()
  {
    return $("#cookie-consent-modal");
  }

  get cookieConsentPopupsPopupNotNowButton()
  {
    return $("#cookie-consent-modal-close");
  }

  get cookieConsentPopupsPopupOkGotItButton()
  {
    return $("#cookie-consent-modal-accept");
  }

  get linkInNotificationMessage()
  {
    return $("//p[@id='notification-message']/a");
  }

  get notificationMessage()
  {
    return $("#notification-message");
  }

  get numberOfAdsBlockedThisPage()
  {
    return $("//div[@id='stats-page']/strong");
  }

  get numberOfAdsBlockedInTotal()
  {
    return $("//div[@id='stats-total']/strong");
  }

  get premiumButton()
  {
    return $("#premium-manage");
  }

  get statsTotalLabel()
  {
    return $("//span[@data-i18n='stats_label_total']");
  }

  get stopShowingNotificationsButton()
  {
    return $("//button[contains(.,'Stop showing notifications')]");
  }

  get upgradeButton()
  {
    return $("#premium-upgrade");
  }

  get yesButton()
  {
    return $("//p[@id='notification-message']/a");
  }

  get thisDomainToggle()
  {
    return $("//*[@id='page-status']/div[1]/io-circle-toggle");
  }

  get thisPageToggle()
  {
    return $("//*[@id='page-status']/div[2]/io-circle-toggle");
  }

  get blockSpecificElementButton()
  {
    return $("//*[@id='block-element']");
  }

  get blockElementCancelButton()
  {
    return $("//*[@id='block-element-cancel']");
  }

  get pageStatsCounter()
  {
    return $("#stats-page > strong");
  }

  get refreshButton()
  {
    return $("#page-refresh").$("button");
  }

  get refreshMessage()
  {
    return $("//*[@id='page-refresh']/div/span");
  }

  get nothingToBlockText()
  {
    return $("//*[@id='idle-status']/h2");
  }

  get reportIssueButton()
  {
    return $("//*[@id='issue-reporter']/span");
  }

  async clickBlockCookieConsentPopupsTitle()
  {
    await (await this.blockCookieConsentPopupsTitle).click();
  }

  async clickBlockCookieConsentPopupsToggle()
  {
    await (await this.blockCookieConsentPopupsToggle).click();
  }

  async clickBlockMoreDistractionsTitle()
  {
    await (await this.blockMoreDistractionsTitle).click();
  }

  async clickBlockMoreDistractionsToggle()
  {
    await (await this.blockMoreDistractionsToggle).click();
  }

  async clickCloseNotificationButton()
  {
    await (await this.closeNotificationButton).click();
  }

  async clickCookieConsentPopupsPopupNotNowButton()
  {
    await (await this.cookieConsentPopupsPopupNotNowButton).click();
  }


  async clickCookieConsentPopupsPopupOkGotItButton()
  {
    await (await this.cookieConsentPopupsPopupOkGotItButton).click();
  }

  async clickLinkInNotificationMessage()
  {
    await (await this.linkInNotificationMessage).click();
  }

  async clickStopShowingNotificationsButton()
  {
    await (await this.stopShowingNotificationsButton).click();
  }

  async clickUpgradeButton()
  {
    await this.waitForEnabledThenClick(this.upgradeButton);
  }

  async clickYesButton()
  {
    await (await this.yesButton).click();
  }

  async getNotificationBorderColor()
  {
    return browser.executeScript("return window.getComputedStyle" +
      "(document.querySelector('#notification .content'),':before')." +
      "getPropertyValue('border-top-color')", []);
  }

  async getNotificationMessageText()
  {
    return await (await this.notificationMessage).getText();
  }

  async getNumberOfAdsBlockedOnThisPageText()
  {
    return await (await this.numberOfAdsBlockedThisPage).getText();
  }

  async getNumberOfAdsBlockedInTotalText()
  {
    return await (await this.numberOfAdsBlockedInTotal).getText();
  }

  async getStatsTotalLabelText()
  {
    return await (await this.statsTotalLabel).getText();
  }

  async isBlockCookieConsentPopupsCrownIconDisplayed()
  {
    const bgImage = await (await this.blockCookieConsentPopupsPremiumTitle).
      getCSSProperty("mask-image", "::before");
    const isDisplayed = await (await this.
      blockCookieConsentPopupsPremiumTitle).isDisplayed();
    const hasCrownIcon = JSON.stringify(bgImage).
      includes("/skin/icons/premium-crown.svg");
    return isDisplayed && hasCrownIcon;
  }

  async isBlockCookieConsentPopupsLockIconDisplayed()
  {
    const bgImage = await (await this.blockCookieConsentPopupsTitle).
      getCSSProperty("background-image", "::before");
    const isDisplayed = await (await this.
      blockCookieConsentPopupsTitle).isDisplayed();
    const hasLockIcon = JSON.stringify(bgImage).
      includes("/skin/icons/premium-lock.svg");
    return isDisplayed && hasLockIcon;
  }

  async isBlockCookieConsentPopupsTitleDisplayed()
  {
    return await (await this.blockCookieConsentPopupsTitle).isDisplayed();
  }

  async isBlockCookieConsentPopupsPremiumTitleDisplayed()
  {
    return await (await this.
      blockCookieConsentPopupsPremiumTitle).isDisplayed();
  }

  async isBlockCookieConsentPopupsToggleDisplayed()
  {
    return await (await this.blockCookieConsentPopupsToggle).isDisplayed();
  }

  async isBlockCookieConsentPopupsToggleSelected()
  {
    return await (await this.blockCookieConsentPopupsToggle).
      getAttribute("aria-checked") === "true";
  }

  async isBlockMoreDistractionsCrownIconDisplayed()
  {
    const bgImage = await (await this.blockMoreDistractionsPremiumTitle).
      getCSSProperty("mask-image", "::before");
    const isDisplayed = await (await this.
      blockMoreDistractionsPremiumTitle).isDisplayed();
    const hasCrownIcon = JSON.stringify(bgImage).
      includes("/skin/icons/premium-crown.svg");
    return isDisplayed && hasCrownIcon;
  }

  async isBlockMoreDistractionsLockIconDisplayed()
  {
    const bgImage = await (await this.blockMoreDistractionsTitle).
      getCSSProperty("background-image", "::before");
    const isDisplayed = await (await this.
      blockMoreDistractionsTitle).isDisplayed();
    const hasLockIcon = JSON.stringify(bgImage).
      includes("/skin/icons/premium-lock.svg");
    return isDisplayed && hasLockIcon;
  }

  async isBlockMoreDistractionsTitleDisplayed()
  {
    return await (await this.blockMoreDistractionsTitle).isDisplayed();
  }

  async isBlockMoreDistractionsPremiumTitleDisplayed()
  {
    return await (await this.blockMoreDistractionsPremiumTitle).isDisplayed();
  }

  async isBlockMoreDistractionsToggleDisplayed()
  {
    return await (await this.blockMoreDistractionsToggle).isDisplayed();
  }

  async isBlockMoreDistractionsToggleSelected()
  {
    return await (await this.blockMoreDistractionsToggle).
      getAttribute("aria-checked") === "true";
  }

  async isCloseNotificationButtonDisplayed()
  {
    return await (await this.closeNotificationButton).isDisplayed();
  }

  async isCookieConsentPopupsPopupDisplayed()
  {
    return await (await this.cookieConsentPopupsPopup).isDisplayed();
  }

  async isNotificationMessageDisplayed()
  {
    return await (await this.notificationMessage).isDisplayed();
  }

  async isPremiumButtonDisplayed()
  {
    return await (await this.premiumButton).isDisplayed();
  }

  async isStopShowingNotificationsButtonDisplayed()
  {
    return await (await this.stopShowingNotificationsButton).isDisplayed();
  }

  async isUpgradeButtonDisplayed()
  {
    return await (await this.upgradeButton).isDisplayed();
  }

  async switchToProblemPageTab()
  {
    await this.switchToTab("A browser issue has caused your ABP " +
      "settings to be reset.");
  }

  async waitForNumberOfAdsBlockedToBeInRange(min, max)
  {
    let adsBlocked;
    try
    {
      await this.numberOfAdsBlockedInTotal.waitUntil(async function()
      {
        adsBlocked = parseInt(await this.getText(), 10);
        return adsBlocked > min && adsBlocked <= max;
      }, {timeout: 2000});
    }
    catch (err)
    {
      throw new Error("Unexpected ads blocked count. Expected: " +
        `${min} < value <= ${max}. Actual: ${adsBlocked}`);
    }
    return adsBlocked;
  }

  async clickThisDomainToggle()
  {
    await this.waitForEnabledThenClick(this.thisDomainToggle);
  }

  async isDomainToggleChecked()
  {
    if (isFirefox())
    {
      return await this.thisDomainToggle.
      getAttribute("checked") != null;
    }
    return await this.thisDomainToggle.
    getAttribute("checked") === "true";
  }

  async clickThisPageToggle()
  {
    await this.waitForEnabledThenClick(this.thisPageToggle);
  }

  async isPageToggleChecked()
  {
    if (isFirefox())
    {
      return await this.thisPageToggle.
      getAttribute("checked") != null;
    }
    return await this.thisPageToggle.
    getAttribute("checked") === "true";
  }

  async isPageToggleEnabled()
  {
    return await this.thisPageToggle.isClickable();
  }

  async isRefreshButtonDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.refreshButton,
                                              reverseOption);
  }

  async isRefreshMessageDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.refreshMessage,
                                              reverseOption);
  }

  async clickRefreshButton()
  {
    await this.waitForEnabledThenClick(this.refreshButton);
  }

  async isPageStatsCounterDisplayed()
  {
    return await (await this.pageStatsCounter).isDisplayed();
  }

  async isBlockSpecificElementButtonDisplayed()
  {
    return await (await this.blockSpecificElementButton).isDisplayed();
  }

  async clickBlockSpecificElementButton()
  {
    await this.waitForEnabledThenClick(this.blockSpecificElementButton);
  }

  async isBlockElementCancelButtonDisplayed()
  {
    return await (await this.blockElementCancelButton).isDisplayed();
  }

  async clickBlockElementCancelButton()
  {
    await this.waitForEnabledThenClick(this.blockElementCancelButton);
  }

  async isReportAnIssueButtonDisplayed()
  {
    return await (await this.reportIssueButton).isDisplayed();
  }

  async clickReportAnIssueButton()
  {
    return await this.waitForEnabledThenClick(this.reportIssueButton);
  }

  async isPageToggleDisplayed()
  {
    return await (await this.thisPageToggle).isDisplayed();
  }

  async isDomainToggleDisplayed()
  {
    return await (await this.thisDomainToggle).isDisplayed();
  }

  async isNothingToBlockTextDisplayed()
  {
    return await (await this.nothingToBlockText).isDisplayed();
  }
}

module.exports = PopupPage;
