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

class GooglePage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  async init()
  {
    await browser.url("https://www.google.com/intl/en/");
  }

  get acceptAllButton()
  {
    return $(">>>#L2AGLb");
  }

  get adTag()
  {
    return $("//span[text()='Ad']");
  }

  get searchBox()
  {
    return $("//input[@title='Search']");
  }

  get sponsoredTag()
  {
    return $("//span[text()='Sponsored']");
  }

  async clickAcceptAllButton()
  {
    await this.waitForEnabledThenClick(this.acceptAllButton, 7000);
  }

  async isAdTagDisplayed(reverse = false)
  {
    return await this.waitForDisplayedNoError(this.adTag, reverse, 5000);
  }

  async isSponsoredTagDisplayed(reverse = false)
  {
    return await this.
      waitForDisplayedNoError(this.sponsoredTag, reverse, 5000);
  }

  async searchForText(text)
  {
    await this.waitForEnabledThenClick(this.searchBox);
    await (await this.searchBox).clearValue();
    await this.browser.keys(text);
    await browser.keys("Enter");
  }
}

module.exports = GooglePage;
