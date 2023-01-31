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

class AllowlistedWebsitesPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get _allowlistedWebsitesTabButton()
  {
    return $("//a[contains(@data-i18n, 'options_tab_allowlist')" +
        "and text()='Allowlisted websites']");
  }

  async init()
  {
    await this.waitForDisplayedNoError(this._allowlistedWebsitesTabButton);
    await (await this._allowlistedWebsitesTabButton).click();
  }

  get addWebsiteButton()
  {
    return $("#allowlisting-add-button");
  }

  get allowlistingLearnMoreLink()
  {
    return $("//a[contains(@data-doclink, 'allowlist')" +
        "and text()='Learn more']");
  }

  get allowlistingTableItems()
  {
    // eslint-disable-next-line no-undef
    return $$("//*[@id='allowlisting-table']/li");
  }

  get allowlistingTextbox()
  {
    return $("#allowlisting-textbox");
  }

  async clickAllowlistingLearnMoreLink()
  {
    await (await this.allowlistingLearnMoreLink).click();
  }

  async clickAddWebsiteButton()
  {
    await (await this.addWebsiteButton).click();
  }

  async getAttributeOfAllowlistingTableItems(attribute)
  {
    const classNames = [];
    const tableItems = await this.allowlistingTableItems;
    for (const element of tableItems)
    {
      classNames.push(await element.getAttribute(attribute));
    }
    return classNames;
  }

  async isAddWebsiteButtonEnabled()
  {
    return await (await this.addWebsiteButton).isEnabled();
  }

  async removeAllowlistedDomain(domainName)
  {
    const domainDeleteButton = await $("//li[@aria-label='" +
      domainName + "']/button");
    await this.waitForEnabledThenClick(domainDeleteButton);
  }

  async setAllowlistingTextboxValue(value)
  {
    await (await this.allowlistingTextbox).click();
    await this.browser.keys(value);
  }

  async switchToABPFAQTab()
  {
    await this.switchToTab("FAQ - Basic functionality");
  }
}

module.exports = AllowlistedWebsitesPage;
