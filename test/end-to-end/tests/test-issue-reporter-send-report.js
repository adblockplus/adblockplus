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

const {beforeSequence, getCurrentDate, getABPOptionsTabId,
       globalRetriesNumber} = require("../helpers");
const {expect} = require("chai");
const IssueReportPage = require("../page-objects/issueReport.page");
const IssueReporterPage = require("../page-objects/issueReporter.page");
const dataIssueReporter = require("../test-data/data-issue-reporter");
let globalOrigin;

describe("test issue reporter", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    globalOrigin = await beforeSequence();
  });

  it("should send an issue report", async function()
  {
    const issueReporterPage = new IssueReporterPage(browser);
    const tabId = await getABPOptionsTabId();
    await browser.url(dataIssueReporter.testPageUrl);
    await issueReporterPage.init(globalOrigin, tabId);
    await issueReporterPage.clickPageIsBrokenButton();
    await issueReporterPage.clickContinueButton();
    await issueReporterPage.clickContinueButton();
    expect(await issueReporterPage.
      isContinueButtonEnabled()).to.be.false;
    await issueReporterPage.typeTextToEmailTextbox(
      "test@adblock.org");
    await issueReporterPage.typeTextToCommentTextbox(
      dataIssueReporter.commentText);
    await issueReporterPage.clickSendReportButton();
    expect(await issueReporterPage.getReportSavedText()).to.include(
      dataIssueReporter.savedReportText);
    await issueReporterPage.clickReportSavedLink();
    const issueReportPage = new IssueReportPage(browser);
    try
    {
      await issueReporterPage.switchToIssueReportLoadingTab();
      let attempts = 0;
      while (attempts < 2)
      {
        try
        {
          expect(await issueReportPage.getReportBeingProcessedText()).to.
            include(dataIssueReporter.reportBeingProcessedText);
          break;
        }
        catch (StaleElementException)
        {
          await browser.pause(1000);
        }
        attempts++;
      }
      expect(await issueReportPage.getReportBeingProcessedText()).to.include(
        dataIssueReporter.reportBeingProcessedText);
    }
    catch (Exception) {}
    await issueReportPage.switchToIssueReportTab();
    expect(await issueReportPage.getStatusLabelCellText()).to.include(
      dataIssueReporter.statusCellLabelText);
    expect(await issueReportPage.getStatusValueCellText()).to.include(
      dataIssueReporter.statusCellText);
    expect(await issueReportPage.getWebsiteLabelCellText()).to.include(
      dataIssueReporter.websiteLabelText);
    expect(await issueReportPage.getWebsiteValueCellHref()).to.include(
      dataIssueReporter.websiteCellHref);
    expect(await issueReportPage.getIssueTypeLabelText()).to.include(
      dataIssueReporter.issueTypeLableText);
    expect(await issueReportPage.getIssueTypeValueText()).to.include(
      dataIssueReporter.issueTypeText);
    expect(await issueReportPage.getTimeLabelCellText()).to.include(
      dataIssueReporter.timeCellText);
    let isDatePresent = false;
    const actualDate = await issueReportPage.getTimeValueCellText();
    if (actualDate.includes(getCurrentDate("en-GB")) ||
      actualDate.includes(getCurrentDate("en-US")))
    {
      isDatePresent = true;
    }
    expect(isDatePresent).to.be.true;
    expect(await issueReportPage.getCommentLabelText()).to.include(
      dataIssueReporter.commentLabelText);
    expect(await issueReportPage.getCommentValueText()).to.include(
      dataIssueReporter.commentText);
    expect(await issueReportPage.getEmailLabelCellText()).to.include(
      dataIssueReporter.emailLabelText);
    expect(await issueReportPage.getEmailValueCellText()).to.include(
      dataIssueReporter.emailText);
    await issueReportPage.clickRequestsTabButton();
    expect(await issueReportPage.getNumberOfRowsForRequests()).to.equal(
      6);
    await issueReportPage.clickFiltersTabButton();
    expect(await issueReportPage.getNumberOfRowsForFilters()).to.equal(
      5);
    await issueReportPage.clickSubscriptionsTabButton();
    expect(await issueReportPage.getNumberOfRowsForSubscriptions()).to.equal(
      4);
    await issueReportPage.clickScreenshotTabButton();
    expect(await issueReportPage.isScreenshotDisplayed()).to.be.true;
  });
});
