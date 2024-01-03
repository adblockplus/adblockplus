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

class PremiumPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get getPremiumMonthlyButton()
  {
    return $("//a[@data-plan='monthly']");
  }

  get getStartedWithABPPremiumButton()
  {
    return $("//a[@class='premium-checkout__button premium" +
      "-checkout-success__button']");
  }

  get paymentConfirmedLabel()
  {
    return $("//h4[@i18n='payment_confirmed']");
  }

  get payWithCreditCardButton()
  {
    return $("//span[@i18n='pwyw_method_cc']");
  }

  get premiumCheckoutButton()
  {
    return $("//button[@type='submit']");
  }

  async clickGetPremiumMonthlyButton()
  {
    await this.waitForEnabledThenClick(this.
      getPremiumMonthlyButton);
  }

  async clickGetStartedWithABPPremiumButton()
  {
    await this.waitForEnabledThenClick(this.
      getStartedWithABPPremiumButton, 20000);
  }

  async clickPaymentConfirmedLabel()
  {
    await this.waitForEnabledThenClick(this.
      paymentConfirmedLabel);
  }

  async clickPayWithCreditCardButton()
  {
    await this.waitForEnabledThenClick(this.
      payWithCreditCardButton);
  }

  async clickPremiumCheckoutButton()
  {
    await this.waitForEnabledThenClick(this.
      premiumCheckoutButton);
  }

  async getPaymentConfirmedLabelText()
  {
    await this.waitForDisplayedNoError(this.paymentConfirmedLabel,
                                       false, 15000);
    return await (await this.paymentConfirmedLabel).getText();
  }
}

module.exports = PremiumPage;
