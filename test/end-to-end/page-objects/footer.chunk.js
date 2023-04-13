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

class FooterChunk extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get aboutABPLink()
  {
    return $("//button[contains(@data-i18n, 'options_footer_about')" +
        "and text()='About Adblock Plus']");
  }

  get contributeButton()
  {
    return $(".button=Contribute");
  }

  get heartButton()
  {
    return $("//*[@id='support-us']/div");
  }

  async clickAboutABPLink()
  {
    await (await this.aboutABPLink).click();
  }

  async clickContributeButton()
  {
    await (await this.contributeButton).click();
  }

  async clickHeartButton()
  {
    await this.waitForEnabledThenClick(this.heartButton);
  }

  async switchToContributeTab()
  {
    await this.switchToTab("Contribute to Adblock Plus");
  }
}

module.exports = FooterChunk;
