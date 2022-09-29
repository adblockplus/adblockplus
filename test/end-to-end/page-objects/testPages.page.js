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

// This is used for content available on any test pages
class TestPages extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get banneradsFilter()
  {
    return $("#bannerads-blocking-filter");
  }

  get customBlockingFilter()
  {
    return $("#custom-blocking");
  }

  get customBlockingRegexFilter()
  {
    return $("#custom-blocking-regex");
  }

  get customHidingClass()
  {
    return $("#custom-hiding-class");
  }

  get customHidingId()
  {
    return $("#custom-hiding-id");
  }

  get wpsafeFilter()
  {
    return $("#wpsafelink-blocking-filter");
  }

  get hiddenBySnippetText()
  {
    return $("p*=This should be hidden by a snippet");
  }

  get serverAdDiv()
  {
    return $("#ServerAd");
  }

  get snippetFilterDiv()
  {
    return $("#snippet-filter");
  }

  get zergmodDiv()
  {
    return $("#zergmod");
  }

  async getCustomBlockingFilterText()
  {
    return await (await this.customBlockingFilter).getText();
  }

  async getCustomBlockingRegexFilterText()
  {
    return await (await this.customBlockingRegexFilter).getText();
  }

  async getCustomHidingClassText()
  {
    return await (await this.customHidingClass).getText();
  }

  async getCustomHidingIdText()
  {
    return await (await this.customHidingId).getText();
  }

  async getBanneradsFilterText()
  {
    return await (await this.banneradsFilter).getText();
  }

  async getServerAdDivText()
  {
    return await (await this.serverAdDiv).getText();
  }

  async getWpsafeFilterText()
  {
    return await (await this.wpsafeFilter).getText();
  }

  async getZergmodDivText()
  {
    return await (await this.zergmodDiv).getText();
  }

  async isCustomHidingClassDisplayed()
  {
    return await (await this.customHidingClass).isDisplayed();
  }

  async isCustomHidingIdDisplayed()
  {
    return await (await this.customHidingId).isDisplayed();
  }

  async isHiddenBySnippetTextDisplayed()
  {
    return await (await this.hiddenBySnippetText).isDisplayed();
  }

  async isServerAdDivDisplayed()
  {
    return await (await this.serverAdDiv).isDisplayed();
  }

  async isSnippetFilterDivDisplayed()
  {
    return await (await this.snippetFilterDiv).isDisplayed();
  }

  async isZergmodDivDisplayed()
  {
    return await (await this.zergmodDiv).isDisplayed();
  }
}

module.exports = TestPages;
