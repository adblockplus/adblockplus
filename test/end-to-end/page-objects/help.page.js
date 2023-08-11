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

class HelpPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get _helpTabButton()
  {
    return $("//a[contains(@data-i18n, 'options_tab_help')" +
        "and text()='Help']");
  }

  async init()
  {
    await (await this._helpTabButton).click();
  }

  get facebookLink()
  {
    return $(".facebook");
  }

  get forumLink()
  {
    return $("//a[text()='Go to the Forum']");
  }

  get sendUsABugReportLink()
  {
    return $("//a[text()='Send us a bug report']");
  }

  get twitterLink()
  {
    return $(".twitter");
  }

  get visitOurHelpCenterLink()
  {
    return $("//a[text()='Visit our Help Center (English only)']");
  }

  async clickFacebookLink()
  {
    await (await this.facebookLink).click();
  }

  async clickForumLink()
  {
    await (await this.forumLink).click();
  }

  async clickSendUsABugReportLink()
  {
    await (await this.sendUsABugReportLink).click();
  }

  async clickTwitterLink()
  {
    await (await this.twitterLink).click();
  }

  async clickVisitOurHelpCenterLink()
  {
    await (await this.visitOurHelpCenterLink).click();
  }

  async switchToBugReportTab()
  {
    await this.switchToTab("Report an issue");
  }

  async switchToFacebookTab()
  {
    await this.switchToTab(/Facebook/);
  }

  async switchToForumTabChrome()
  {
    await this.switchToTab("Adblock Plus for Chrome support - Adblock Plus");
  }

  async switchToForumTabFirefox()
  {
    await this.switchToTab("Adblock Plus for Firefox support - Adblock Plus");
  }

  async switchToHelpCenterTab()
  {
    await this.switchToTab("https://help.adblockplus.org/hc/en-us");
  }

  async switchToTwitterTab()
  {
    await this.switchToTab(/https:\/\/twitter\.com\/.*adblockplus/);
  }
}

module.exports = HelpPage;
