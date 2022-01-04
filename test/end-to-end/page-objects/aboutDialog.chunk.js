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

class AboutDialogChunk extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get closeButton()
  {
    return $("//button[@data-action='close-dialog']");
  }

  get copyrightText()
  {
    return $("//*[@id='copyright']");
  }

  get dialog()
  {
    return $("//*[@id='dialog']");
  }

  get eyeoGmbhLink()
  {
    return $("//a[text()='eyeo GmbH']");
  }

  get privacyPolicyLink()
  {
    return $("//*[@id='privacy-policy']");
  }

  async clickCloseButton()
  {
    await (await this.closeButton).click();
  }

  async clickEyeoGmbhLink()
  {
    await (await this.eyeoGmbhLink).click();
  }

  async clickPrivacyPolicyLink()
  {
    await (await this.privacyPolicyLink).click();
  }

  async getCopyrightText()
  {
    return await (await this.copyrightText).getText();
  }

  async isDialogDisplayed()
  {
    return await (await this.dialog).isDisplayed();
  }

  async switchToImprintTab()
  {
    await this.switchToTab("Imprint");
  }

  async switchToPrivacyPolicyTab()
  {
    await this.switchToTab("Privacy Policy");
  }
}

module.exports = AboutDialogChunk;
