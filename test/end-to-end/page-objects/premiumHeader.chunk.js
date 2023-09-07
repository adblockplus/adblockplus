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

class PremiumHeaderChunk extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get learnMorePremium()
  {
    return $("//p[@id='premium-upgrade-description']/a");
  }

  get manageMySubscriptionButton()
  {
    return $("//a[@data-i18n='options_premium_manage']");
  }

  get premiumButton()
  {
    return $("//a[@class='button premium-label']");
  }

  get premiumHeader()
  {
    return $("//aside[@class='premium-banner-container']");
  }

  get premiumUpgradeText()
  {
    return $("#premium-upgrade-description");
  }

  get upgradeButton()
  {
    return $("//div/a[@data-i18n='options_upgrade_button']");
  }

  async clickLearnMorePremiumLink()
  {
    await this.waitForEnabledThenClick(this.learnMorePremium);
  }

  async clickManageMySubscriptionButton()
  {
    await this.waitForEnabledThenClick(this.
      manageMySubscriptionButton);
  }

  async clickPremiumButton()
  {
    await this.waitForEnabledThenClick(this.premiumButton);
  }

  async clickUpgradeButton()
  {
    await this.waitForEnabledThenClick(this.
      upgradeButton);
  }

  async getPremiumUpgradeText()
  {
    return await (await this.premiumUpgradeText).getText();
  }

  async isLearnMorePremiumLinkDisplayed()
  {
    return await this.waitForDisplayedNoError(this.learnMorePremium);
  }

  async isManageMySubscriptionButtonDisplayed()
  {
    return await (await this.manageMySubscriptionButton).isDisplayed();
  }

  async isPremiumButtonDisplayed()
  {
    return await (await this.premiumButton).isDisplayed();
  }

  async isPremiumHeaderDisplayed()
  {
    return await this.waitForDisplayedNoError(this.premiumHeader);
  }

  async isUpgradeButtonDisplayed(timeout)
  {
    return await this.waitForDisplayedNoError(
      this.upgradeButton, false, timeout);
  }
}

module.exports = PremiumHeaderChunk;
