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

class StripeCheckoutPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  async init()
  {
    await this.waitForDisplayedNoError(this.subscribeButton);
  }

  get cardCvcTextField()
  {
    return $("#cardCvc");
  }

  get cardExpiryTextField()
  {
    return $("#cardExpiry");
  }

  get cardNumberTextField()
  {
    return $("#cardNumber");
  }

  get emailTextField()
  {
    return $("#email");
  }

  get nameOnCardTextField()
  {
    return $("#billingName");
  }

  get subscribeButton()
  {
    return $("//button[@type='submit']");
  }

  get zipTextField()
  {
    return $("#billingPostalCode");
  }

  async clickSubscribeButton()
  {
    await this.waitForEnabledThenClick(this.
      subscribeButton);
  }

  async typeTextToCardCvcField(text)
  {
    await (await this.cardCvcTextField).click();
    await browser.keys(text);
  }

  async typeTextToCardExpiryField(text)
  {
    await (await this.cardExpiryTextField).click();
    await browser.keys(text);
  }

  async typeTextToCardNumberField(text)
  {
    await (await this.cardNumberTextField).click();
    await browser.keys(text);
  }

  async typeTextToEmailField(text)
  {
    await (await this.emailTextField).click();
    await browser.keys(text);
  }

  async typeTextToNameOnCardField(text)
  {
    await (await this.nameOnCardTextField).click();
    await browser.keys(text);
  }

  async typeTextToZIPField(text)
  {
    await (await this.zipTextField).click();
    await browser.keys(text);
  }
}

module.exports = StripeCheckoutPage;
