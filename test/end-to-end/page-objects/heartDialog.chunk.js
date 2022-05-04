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

class HeartDialogChunk extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get rateUsButton()
  {
    return $("//a[@data-i18n='options_rating_button']");
  }

  get donateButton()
  {
    return $("//a[@data-i18n='options_donate_button']");
  }

  async clickRateUsButton()
  {
    await (await this.rateUsButton).click();
  }

  async clickDonateButton()
  {
    await (await this.donateButton).click();
  }

  async isDonateButtonDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      donateButton, reverseOption);
  }

  async isRateUsButtonDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      rateUsButton, reverseOption);
  }

  async switchToAddonsTab()
  {
    await this.switchToTab("Adblock Plus – Get this Extension" +
    " for 🦊 Firefox (en-GB)");
  }

  async switchToChromeWebstoreTab()
  {
    await this.switchToTab("Adblock Plus - free ad blocker - " +
    "Chrome Web Store");
  }

  async switchToWebstoreCookiesAgreementTab()
  {
    await this.switchToTab("Before you continue");
  }

  async switchToDonateTab()
  {
    await this.switchToTab("Donate to Adblock Plus");
  }
}

module.exports = HeartDialogChunk;
