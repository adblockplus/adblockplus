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

class IssueReporterPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  async init(origin, tabId)
  {
    await this.browser.newWindow(`${origin}/issue-reporter.html?${tabId}`);
    await (await this.cancelButton).waitForExist({timeout: 10000});
  }

  get anonymousSubmissionCheckbox()
  {
    return $("#anonymousSubmission");
  }

  get cancelButton()
  {
    return $("#cancel");
  }

  get commentTextbox()
  {
    return $("#comment");
  }

  get continueButton()
  {
    return $("#continue");
  }

  get detailsButton()
  {
    return $("//button[text()='Details']");
  }

  get doneButton()
  {
    return $("//button[text()='Done']");
  }

  get emailTextbox()
  {
    return $("#email");
  }

  get highlightButton()
  {
    return $("//button[@class='highlight']");
  }

  get highlightIssueHeader()
  {
    return $("//h1[text()='Highlight issue']");
  }

  get includeConfigCheckbox()
  {
    return $("#includeConfig");
  }

  get iStillSeeAdsButton()
  {
    return $("#typeFalseNegative");
  }

  get markIssueButton()
  {
    return $("//button[text()='Mark issue']");
  }

  get otherIssues()
  {
    return $("#other-issues");
  }

  get pageIsBrokenButton()
  {
    return $("#typeFalsePositive");
  }

  get privacyPolicyLink()
  {
    return $("#privacyPolicy");
  }

  get reportSavedLink()
  {
    return $("#link");
  }

  get reportSavedText()
  {
    return $("//body/p");
  }

  get screenshotArea()
  {
    return $("//canvas");
  }

  get selectIssueButton()
  {
    return $("//button[text()='Select issue']");
  }

  get sendReportButton()
  {
    return $("#send");
  }

  get sendReportIFrame()
  {
    return $("#result");
  }

  get showReportDataButton()
  {
    return $("#showData");
  }

  get showDataValue()
  {
    return $("#showDataValue");
  }

  get topNotification()
  {
    return $("#notification-text");
  }

  async clickAnonymousSubmissionCheckbox()
  {
    await this.waitForEnabledThenClick(this.anonymousSubmissionCheckbox);
  }

  async clickCancelButton()
  {
    await this.waitForEnabledThenClick(this.cancelButton);
  }

  async clickContinueButton()
  {
    await this.waitForEnabledThenClick(this.continueButton, 5000);
  }

  async clickHighlightButton()
  {
    await this.waitForEnabledThenClick(this.highlightButton);
  }

  async clickIncludeConfigCheckbox()
  {
    await this.waitForEnabledThenClick(this.includeConfigCheckbox);
  }

  async clickIStillSeeAdsButton()
  {
    await this.waitForEnabledThenClick(this.iStillSeeAdsButton);
  }

  async clickPageIsBrokenButton()
  {
    await this.waitForEnabledThenClick(this.pageIsBrokenButton);
  }

  async clickPrivacyPolicyLink()
  {
    await this.waitForEnabledThenClick(this.privacyPolicyLink);
  }

  async clickReportSavedLink()
  {
    await this.browser.switchToFrame(await this.sendReportIFrame);
    await this.waitForEnabledThenClick(this.reportSavedLink);
    await this.browser.switchToParentFrame();
  }

  async clickSendReportButton()
  {
    await this.waitForEnabledThenClick(this.sendReportButton);
  }

  async clickShowReportDataButton()
  {
    await this.waitForEnabledThenClick(this.showReportDataButton);
  }

  async getOtherIssuesText()
  {
    return await (await
    this.otherIssues).getText();
  }

  async getReportSavedText()
  {
    await this.browser.switchToFrame(await this.sendReportIFrame);
    const savedText = await (await
    this.reportSavedText).getText();
    await this.browser.switchToParentFrame();
    return savedText;
  }

  async getShowDataValueText()
  {
    return await (await
    this.showDataValue).getText();
  }

  async getTopNotificationText()
  {
    return await (await
    this.topNotification).getText();
  }

  async isCancelButtonDisplayed()
  {
    return await (await this.cancelButton).isExisting();
  }

  async isCancelButtonEnabled()
  {
    return await (await this.cancelButton).isEnabled();
  }

  async isContinueButtonDisplayed()
  {
    return await (await this.continueButton).isExisting();
  }

  async isContinueButtonEnabled()
  {
    return await (await this.continueButton).isEnabled();
  }

  async isDetailsButtonDisplayed()
  {
    return await (await this.detailsButton).isExisting();
  }

  async isDetailsButtonEnabled()
  {
    return await (await this.detailsButton).isEnabled();
  }

  async isDoneButtonDisplayed()
  {
    return await (await this.doneButton).isExisting();
  }

  async isDoneButtonEnabled()
  {
    return await (await this.doneButton).isEnabled();
  }

  async isHighlightIssueHeaderDisplayed()
  {
    return await (await this.highlightIssueHeader).isDisplayed();
  }

  async isMarkIssueButtonDisplayed()
  {
    return await (await this.markIssueButton).isExisting();
  }

  async isMarkIssueButtonEnabled()
  {
    return await (await this.markIssueButton).isEnabled();
  }

  async isSelectIssueButtonDisplayed()
  {
    return await (await this.selectIssueButton).isExisting();
  }

  async isScreenshotAreaDisplayed()
  {
    return await (await this.screenshotArea).isDisplayed();
  }

  async isSelectIssueButtonEnabled()
  {
    return await (await this.selectIssueButton).isEnabled();
  }

  async switchToIssueReportLoadingTab()
  {
    await this.switchToTab("Issue report being processed");
  }

  async switchToPrivacyPolicyTab()
  {
    await this.switchToTab("Privacy Policy");
  }

  async typeTextToCommentTextbox(text)
  {
    await (await this.commentTextbox).click();
    await this.browser.keys(text);
  }

  async typeTextToEmailTextbox(text)
  {
    await (await this.emailTextbox).click();
    await this.browser.keys(text);
  }
}

module.exports = IssueReporterPage;
