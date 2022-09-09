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

  get wpsafeFilter()
  {
    return $("#wpsafelink-blocking-filter");
  }

  get hiddenBySnippetText()
  {
    return $("p*=This should be hidden by a snippet");
  }

  get serveAd1Div()
  {
    return $("#serveAd1");
  }

  get snippetFilterDiv()
  {
    return $("#snippet-filter");
  }

  get zergmodDiv()
  {
    return $("#zergmod");
  }

  async getWpsafeFilterText()
  {
    return await (await this.wpsafeFilter).getText();
  }

  async getBanneradsFilterText()
  {
    return await (await this.banneradsFilter).getText();
  }

  async getServeAd1DivText()
  {
    return await (await this.serveAd1Div).getText();
  }

  async getZergmodDivText()
  {
    return await (await this.zergmodDiv).getText();
  }

  async isHiddenBySnippetTextDisplayed()
  {
    return await (await this.hiddenBySnippetText).isDisplayed();
  }

  async isServeAd1DivDisplayed()
  {
    return await (await this.serveAd1Div).isDisplayed();
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
