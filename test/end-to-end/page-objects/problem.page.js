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

class ProblemPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  async init(origin)
  {
    await browser.url(`${origin}/problem.html`);
  }

  get abpLogo()
  {
    return $("//a[@data-doclink='adblock_plus']");
  }

  get clickHereToReinstallButton()
  {
    return $("//a[@data-i18n='problem_solution_action']");
  }

  get contactUsButton()
  {
    return $("//a[@data-i18n-title='problem_social_email']");
  }

  get eyeoGmbHLink()
  {
    return $("//a[text()='eyeo GmbH']");
  }

  get facebookButton()
  {
    return $("//a[@data-i18n-title='problem_social_facebook']");
  }

  get pageTitle()
  {
    return $("//h1[@data-i18n='problem_title']");
  }

  get twitterButton()
  {
    return $("//a[@data-i18n-title='problem_social_twitter']");
  }

  async getPageTitleText()
  {
    return await (await this.pageTitle).getText();
  }
}

module.exports = ProblemPage;
