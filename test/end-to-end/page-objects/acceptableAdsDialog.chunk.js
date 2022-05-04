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

class AcceptableAdsDialogChunk extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get aaDialog()
  {
    return $("//*[@id='acceptable-ads-why-not']");
  }

  get goToSurveyButton()
  {
    return $("//a[@data-i18n='options_aa_opt_out_survey_ok']");
  }

  get noThanksButton()
  {
    return $("//button[@data-i18n='options_aa_opt_out_survey_no']");
  }

  async clickGoToSurveyButton()
  {
    await this.waitForEnabledThenClick(this.
      goToSurveyButton);
  }

  async clickNoThanksButton()
  {
    await (await this.noThanksButton).click();
  }

  async isAADialogDisplayed()
  {
    return await (await this.aaDialog).isDisplayed();
  }

  async isGoToSurveyButtonDisplayed()
  {
    return await (await this.goToSurveyButton).isDisplayed();
  }

  async isNoThanksButtonDisplayed()
  {
    return await (await this.noThanksButton).isDisplayed();
  }

  async switchToAASurveyTab()
  {
    await this.switchToTab("Acceptable Ads have been turned off");
  }
}

module.exports = AcceptableAdsDialogChunk;
