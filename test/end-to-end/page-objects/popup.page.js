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
    await (await this.upgradeButton).waitForExist({timeout: 10000});
  }

  get closeNotificationButton()
  {
    return $("//button[contains(.,'Close')]");
  }

  get linkInNotificationMessage()
  {
    return $("//p[@id='notification-message']/a");
  }

  get notificationMessage()
  {
    return $("#notification-message");
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

  async clickCloseNotificationButton()
  {
    await (await this.closeNotificationButton).click();
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

  async getNumberOfAdsBlockedInTotalText()
  {
    return await (await this.numberOfAdsBlockedInTotal).getText();
  }

  async getStatsTotalLabelText()
  {
    return await (await this.statsTotalLabel).getText();
  }

  async isCloseNotificationButtonDisplayed()
  {
    return await (await this.closeNotificationButton).isDisplayed();
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

  async waitForNumberOfAdsBlockedInTotalTextToEqual(text, timeoutVal = 3000)
  {
    return await this.waitUntilTextIs(this.numberOfAdsBlockedInTotal,
                                      text, timeoutVal);
  }

  async clickThisDomainToggle()
  {
    await this.waitForEnabledThenClick(this.thisDomainToggle);
  }

  async isDomainToggleChecked()
  {
    return await this.thisDomainToggle.
    getAttribute("aria-checked") === "true";
  }

  async clickThisPageToggle()
  {
    await this.waitForEnabledThenClick(this.thisPageToggle);
  }

  async isPageToggleChecked()
  {
    return await this.thisPageToggle.
    getAttribute("aria-checked") === "true";
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
}

module.exports = PopupPage;

