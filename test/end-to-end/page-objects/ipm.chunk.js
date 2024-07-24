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

class IPMChunk extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  async init()
  {
    const iframe = await this.ipmIframe;
    await iframe.waitForExist({timeout: 10000});
    await browser.switchToFrame(await this.ipmIframe);
    await this.waitForDisplayedNoError(this.ipmTitle);
  }

  get ipmCTAButton()
  {
    return $("#continue");
  }

  get ipmBody()
  {
    return $("#body");
  }

  get ipmDialog()
  {
    return $("#__abp-overlay-onpage-dialog");
  }

  get ipmIframe()
  {
    return $("//iframe[@frameborder='0']");
  }

  get ipmTitle()
  {
    return $("#title");
  }

  async clickIPMCTAButton()
  {
    await (await this.ipmCTAButton).click();
  }

  async getIPMBodyText()
  {
    return await (await this.ipmBody).getText();
  }

  async getIPMTitleText()
  {
    return await (await this.ipmTitle).getText();
  }

  async isIPMDialogDisplayed()
  {
    return await (await this.ipmDialog).isDisplayed();
  }

  async isIPMiFrameExisting()
  {
    return await (await this.ipmIframe).isExisting();
  }
}

module.exports = IPMChunk;
