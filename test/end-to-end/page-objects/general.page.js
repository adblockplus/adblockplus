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

class GeneralPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get _generalTabButton()
  {
    return this.browser
      .$("//a[contains(@data-i18n, 'options_tab_general')" +
        "and text()='General']");
  }

  async init()
  {
    await (await this._generalTabButton).click();
  }

  get acceptableAdsCriteriaLink()
  {
    return this.browser
      .$("//*[@id='enable-acceptable-ads-description']/a");
  }

  get acceptableAdsLearnMoreLink()
  {
    return this.browser
      .$("//a[contains(@data-doclink, 'privacy_friendly_ads')" +
        "and text()='Learn more']");
  }

  get allowAcceptableAdsCheckbox()
  {
    return this.browser
      .$("#acceptable-ads-allow");
  }

  async clickAcceptableAdsCriteriaLink()
  {
    await (await this.acceptableAdsCriteriaLink).click();
  }

  async clickAcceptableAdsLearnMoreLink()
  {
    await (await this.acceptableAdsLearnMoreLink).click();
  }

  async clickAllowAcceptableAdsCheckbox()
  {
    await (await this.allowAcceptableAdsCheckbox).click();
  }

  async switchToAAInfoTab()
  {
    await this.switchToTab("Allowing acceptable ads in Adblock Plus");
  }
}

module.exports = GeneralPage;
