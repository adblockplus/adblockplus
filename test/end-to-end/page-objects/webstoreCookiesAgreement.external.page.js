/* eslint-disable no-undef */
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

class WebstoreCookiesAgreementPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get iAgreeButton()
  {
    return $("//button[@aria-label='Agree to the use of cookies " +
        "and other data for the purposes described']");
  }

  async clickIAgreeButton()
  {
    await (await this.iAgreeButton).click();
  }

  async switchToWebstoreTab()
  {
    await this.switchToTab("Adblock Plus - free ad blocker - Chrome Web Store");
  }
}

module.exports = WebstoreCookiesAgreementPage;
