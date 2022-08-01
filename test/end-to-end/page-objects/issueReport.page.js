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

class IssueReportPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get commentLabelCell()
  {
    return $("//*[@id='commentRow']/td[1]");
  }

  get commentValueCell()
  {
    return $("//*[@id='commentRow']/td[2]");
  }

  get emailLabelCell()
  {
    return $("//*[@id='emailRow']/td");
  }

  get emailValueCell()
  {
    return $("//*[@id='emailCell']/a");
  }

  get filtersTabButton()
  {
    return $("#filtersTab");
  }

  get filtersTable()
  {
    return $("#filters");
  }

  get issueTypeLabelCell()
  {
    return $("//*[@id='typeRow']/td[1]");
  }

  get issueTypeValueCell()
  {
    return $("//*[@id='typeRow']/td[2]");
  }

  get reportBeingProcessedText()
  {
    return $("//body/div");
  }

  get requestsTabButton()
  {
    return $("#requestsTab");
  }

  get requestsTable()
  {
    return $("#requests");
  }

  get screenshotTabButton()
  {
    return $("#screenshotTab");
  }

  get screenshotTabImage()
  {
    return $("//*[@id='screenshotBox']/p/img");
  }

  get statusLabelCell()
  {
    return $("//*[@id='statusRow']/td[1]");
  }

  get statusValueCell()
  {
    return $("#statusCell");
  }

  get subscriptionsTabButton()
  {
    return $("#subscriptionsTab");
  }

  get subscriptionsTable()
  {
    return $("#subscriptions");
  }

  get timeLabelCell()
  {
    return $("//*[@id='timeRow']/td[1]");
  }

  get timeValueCell()
  {
    return $("//*[@id='timeRow']/td[2]");
  }

  get websiteLabelCell()
  {
    return $("//*[@id='mainURLRow']/td[1]");
  }

  get websiteValueCell()
  {
    return $("//*[@id='mainURLRow']/td[2]/a");
  }

  async clickFiltersTabButton()
  {
    await this.waitForEnabledThenClick(this.filtersTabButton);
  }

  async clickRequestsTabButton()
  {
    await this.waitForEnabledThenClick(this.requestsTabButton);
  }

  async clickScreenshotTabButton()
  {
    await this.waitForEnabledThenClick(this.screenshotTabButton);
  }

  async clickSubscriptionsTabButton()
  {
    await this.waitForEnabledThenClick(this.subscriptionsTabButton);
  }

  async getCommentLabelText()
  {
    return await (await this.commentLabelCell).getText();
  }

  async getCommentValueText()
  {
    return await (await this.commentValueCell).getText();
  }

  async getEmailLabelCellText()
  {
    return await (await this.emailLabelCell).getText();
  }

  async getEmailValueCellText()
  {
    return await (await this.emailValueCell).getText();
  }

  async getIssueTypeLabelText()
  {
    return await (await this.issueTypeLabelCell).getText();
  }

  async getIssueTypeValueText()
  {
    return await (await this.issueTypeValueCell).getText();
  }

  async getNumberOfRows(tableElement)
  {
    return (await tableElement.$$("tr")).length;
  }

  async getNumberOfRowsForFilters()
  {
    return this.getNumberOfRows(await this.filtersTable);
  }

  async getNumberOfRowsForRequests()
  {
    return this.getNumberOfRows(await this.requestsTable);
  }

  async getNumberOfRowsForSubscriptions()
  {
    return this.getNumberOfRows(await this.subscriptionsTable);
  }

  async getReportBeingProcessedText()
  {
    return await (await this.reportBeingProcessedText).getText();
  }

  async getStatusLabelCellText()
  {
    return await (await this.statusLabelCell).getText();
  }

  async getStatusValueCellText()
  {
    return await (await this.statusValueCell).getText();
  }

  async getTimeLabelCellText()
  {
    return await (await this.timeLabelCell).getText();
  }

  async getTimeValueCellText()
  {
    return await (await this.timeValueCell).getText();
  }

  async getWebsiteLabelCellText()
  {
    return await (await this.websiteLabelCell).getText();
  }

  async getWebsiteValueCellHref()
  {
    return await (await this.websiteValueCell).getAttribute("href");
  }

  async isScreenshotDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.screenshotTabImage,
                                              reverseOption);
  }

  async switchToIssueReportTab()
  {
    await this.switchToTab("Issue report for adblockinc.gitlab.io", 90000);
  }
}

module.exports = IssueReportPage;
