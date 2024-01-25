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

class FirstRunPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  async init(origin)
  {
    await browser.url(`${origin}/first-run.html`);
  }

  get abpLogo()
  {
    return $("#navbar-logo");
  }

  get appStoreButton()
  {
    return $("//a[@data-doclink='adblock_browser_ios_store']");
  }

  get donateButton()
  {
    return $("#navbar-donate");
  }

  get eyeoGmbHLink()
  {
    return $("//a[text()='eyeo GmbH']");
  }

  get googlePlayButton()
  {
    return $("//a[@data-doclink='adblock_browser_android_store']");
  }

  get settingsLink()
  {
    return $("//a[text()='Settings']");
  }

  get strictCriteriaLink()
  {
    return $("//a[text()='strict criteria']");
  }

  get subtitleText()
  {
    return $("//p[@data-i18n='firstRun_subtitle']");
  }

  get termsOfUseLink()
  {
    return $("//a[text()='Terms of Use']");
  }

  get turnOffAALink()
  {
    return $("//a[text()='Turn off Acceptable Ads']");
  }

  async getSubtitleText()
  {
    return await (await this.subtitleText).getText();
  }
}

module.exports = FirstRunPage;
