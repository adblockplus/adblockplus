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

class ExtensionsPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  async init()
  {
    if (browser.capabilities.browserName.toLowerCase().includes("chrome"))
    {
      await browser.url("chrome://extensions");
    }
    else if (browser.capabilities.browserName.toLowerCase().includes("edge"))
    {
      await browser.url("edge://extensions");
    }
    else if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      await browser.url("about:debugging#/runtime/this-firefox");
      await this.waitForDisplayedNoError(this.abpExtensionLabelFF);
    }
  }

  get abpExtensionLabelFF()
  {
    return $("//span[text()='Adblock Plus - free ad blocker']");
  }

  get reloadExtensionButtonChrome()
  {
    return $(">>>#dev-reload-button");
  }

  get reloadExtensionButtonEdge()
  {
    return $("//span[text()='Reload']");
  }

  get reloadExtensionButtonFF()
  {
    return $("//button[text()='Reload']");
  }

  get removeExtensionButton()
  {
    return $(">>>#removeButton");
  }

  async clickReloadExtensionButton()
  {
    if (browser.capabilities.browserName.toLowerCase().includes("chrome"))
    {
      await this.waitForEnabledThenClick(this.
        reloadExtensionButtonChrome);
    }
    else if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
    {
      await this.waitForEnabledThenClick(this.
        reloadExtensionButtonFF);
    }
    else if (browser.capabilities.browserName.toLowerCase().includes("edge"))
    {
      await this.waitForEnabledThenClick(this.
        reloadExtensionButtonEdge);
    }
  }

  async clickRemoveExtensionButton()
  {
    await this.waitForEnabledThenClick(this.
      removeExtensionButton);
  }
}

module.exports = ExtensionsPage;
