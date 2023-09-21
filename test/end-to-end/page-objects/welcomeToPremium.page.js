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

class WelcomeToPremium extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get blockCookieConsentPopupsCheckbox()
  {
    return $("//io-checkbox[@data-feature='cookies-premium']/button");
  }

  get doneButton()
  {
    return $("#cta-finish");
  }

  get enableAllPremiumFeaturesButton()
  {
    return $("#cta-enable-all");
  }

  get upgradeNowButton()
  {
    return $("#cta-upgrade");
  }

  async clickDoneButton()
  {
    await this.waitForEnabledThenClick(this.doneButton);
  }

  async clickEnableAllPremiumFeaturesButton()
  {
    await this.waitForEnabledThenClick(this.enableAllPremiumFeaturesButton);
  }

  async clickUpgradeNowButton()
  {
    await this.waitForEnabledThenClick(this.upgradeNowButton);
  }

  async isBlockCookieConsentPopupsCheckboxEnabled(reverse = false)
  {
    await this.waitForDisplayedNoError(this.
      blockCookieConsentPopupsCheckbox, reverse);
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

  async isEnableAllPremiumFeaturesButtonDisplayed()
  {
    return await (await this.enableAllPremiumFeaturesButton).isDisplayed();
  }

  async isUpgradeNowButtonDisplayed()
  {
    return await (await this.upgradeNowButton).isDisplayed();
  }
}

module.exports = WelcomeToPremium;
