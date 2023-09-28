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

class OneClickAllowAdsTestPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  async init()
  {
    await browser.newWindow("https://fconeclick.blogspot.com/");
    await this.switchToTab("FC oneclick");
  }

  async visitOneClickSubPage()
  {
    await browser.newWindow("https://fconeclick.blogspot.com/2021/09/1-click.html");
    await this.switchToTab("1-click");
  }

  async visitOneClickAAPage()
  {
    await browser.newWindow("https://fconeclickaa.blogspot.com/");
    await this.switchToTab("FC oneclick AA");
  }

  async visitNoSubdomainUrl()
  {
    await browser.newWindow("https://technium.ch/");
    await this.switchToTab("Technium.ch Home - Technium");
  }

  async visitWWWSubdomainUrl()
  {
    await browser.newWindow("https://www.thesalarycalculator.co.uk");
    await this.switchToTab(
      "The Salary Calculator - 2023 / 2024 Tax Calculator");
  }

  async visitNonWWWSubdomainUrl()
  {
    await browser.newWindow("https://home.macdronic.com/");
    await this.switchToTab("MACDRONIC.COM | Macdronic.com");
  }

  get oneClickButton()
  {
    return $(".fc-button-whitelist");
  }

  get oneClickGFCPaywall()
  {
    return $(".fc-dialog-container");
  }

  get oneClickDismissPaywallX()
  {
    return $(".fc-close");
  }

  async isOneClickGFCPaywallDisplayed(reverse = false)
  {
    return await this.
      waitForDisplayedNoError(this.oneClickGFCPaywall, reverse, 2000);
  }

  async clickOneClickButton(timeoutMs = 1500)
  {
    await this.waitForEnabledThenClick(this.oneClickButton, timeoutMs);
  }

  async clickDismissPaywallX(timeoutMs = 1000)
  {
    await this.waitForEnabledThenClick(this.oneClickDismissPaywallX, timeoutMs);
  }
}

module.exports = OneClickAllowAdsTestPage;
