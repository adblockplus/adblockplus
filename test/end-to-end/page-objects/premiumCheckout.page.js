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

class PremiumCheckoutPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  async init()
  {
    const iframe = await this.paddleFrame;
    await iframe.waitForExist({timeout: 10000});
    await browser.switchToFrame(await this.paddleFrame);
    await this.waitForDisplayedNoError(this.emailTextField);
  }

  get cardCvcTextField()
  {
    return $("#cvv");
  }

  get cardExpiryTextField()
  {
    return $("#expiry");
  }

  get cardNumberTextField()
  {
    return $("#cardNumber");
  }

  get continueButton()
  {
    return $("//button[@type='submit']");
  }

  get emailTextField()
  {
    return $("#email");
  }

  get getStartedWithABPPremiumButton()
  {
    return $("//a[@class='premium-checkout__button premium" +
      "-checkout-success__button']");
  }

  get nameOnCardTextField()
  {
    return $("#cardHolder");
  }

  get paddleFrame()
  {
    return $("//iframe[@name='paddle_frame']");
  }

  get subscribeButton()
  {
    return $("//button[@type='submit']");
  }

  get zipTextField()
  {
    return $("#postcode");
  }

  async clickContinueButton()
  {
    await this.waitForEnabledThenClick(this.
      continueButton);
  }

  async clickSubscribeButton()
  {
    await this.waitForEnabledThenClick(this.
      subscribeButton);
  }

  async isGetStartedWithABPPremiumButtonDisplayed()
  {
    return await (await this.getStartedWithABPPremiumButton).isDisplayed();
  }

  async typeTextToCardCvcField(text)
  {
    await this.waitForEnabledThenClick(this.
      cardCvcTextField, 10000);
    await browser.keys(text);
  }

  async typeTextToCardExpiryField(text)
  {
    await this.waitForEnabledThenClick(this.
      cardExpiryTextField, 10000);
    await browser.keys(text);
  }

  async typeTextToCardNumberField(text)
  {
    await this.waitForEnabledThenClick(this.
      cardNumberTextField, 10000);
    await browser.keys(text);
  }

  async typeTextToEmailField(text)
  {
    await this.waitForEnabledThenClick(this.
      emailTextField, 10000);
    await browser.keys(text);
  }

  async typeTextToNameOnCardField(text)
  {
    await this.waitForEnabledThenClick(this.
      nameOnCardTextField, 10000);
    await browser.keys(text);
  }

  async typeTextToZIPField(text)
  {
    await this.waitForEnabledThenClick(this.
      zipTextField, 10000);
    await browser.keys(text);
  }
}

module.exports = PremiumCheckoutPage;
