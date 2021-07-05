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

class AdvancedPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get _advancedTabButton()
  {
    return this.browser
      .$("//a[contains(@data-i18n, 'options_tab_advanced')" +
        "and text()='Advanced']");
  }

  async init()
  {
    await (await this._advancedTabButton).click();
  }

  get filterListsLearnMoreLink()
  {
    return this.browser
      .$("//a[contains(@data-doclink, 'subscriptions')" +
        "and text()='Learn more']");
  }

  get learnHowToWriteFiltersLink()
  {
    return this.browser
      .$("//a[text()='Learn how to write filters (English only)']");
  }

  async clickFilterListsLearnMoreLink()
  {
    await (await this.filterListsLearnMoreLink).click();
  }

  async clickLearnHowToWriteFiltersLink()
  {
    await (await this.learnHowToWriteFiltersLink).click();
  }

  async switchToHowToWriteFiltersTab()
  {
    await this.switchToTab("How to write filters | Adblock Plus Help Center");
  }

  async switchToSubscriptionsTab()
  {
    await this.switchToTab("Known Adblock Plus subscriptions");
  }
}

module.exports = AdvancedPage;
