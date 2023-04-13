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

const {beforeSequence, getCurrentDate, globalRetriesNumber} =
  require("../helpers");
const {expect} = require("chai");
const IssueReportPage = require("../page-objects/issueReport.page");
const IssueReporterPage = require("../page-objects/issueReporter.page");
const dataIssueReporter = require("../test-data/data-issue-reporter");
let globalOrigin;
let lastTest = false;

describe.skip("test issue reporter", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    globalOrigin = await beforeSequence();
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await browser.reloadSession();
      globalOrigin = await beforeSequence();
    }
  });

  it("should display issue reporter default state", async function()
  {
    const issueReporterPage = new IssueReporterPage(browser);
    const tabId = await issueReporterPage.getABPOptionsTabId();
    await browser.url(dataIssueReporter.testPageUrl);
    await issueReporterPage.init(globalOrigin, tabId);
    expect(await issueReporterPage.getTopNotificationText()).to.equal(
      dataIssueReporter.topNoteText);
    expect(await issueReporterPage.getOtherIssuesText()).to.equal(
      dataIssueReporter.otherIssuesText);
    expect(await issueReporterPage.
      isSelectIssueButtonDisplayed()).to.be.true;
    expect(await issueReporterPage.
      isSelectIssueButtonEnabled()).to.be.true;
    expect(await issueReporterPage.
      isMarkIssueButtonDisplayed()).to.be.true;
    expect(await issueReporterPage.
      isMarkIssueButtonEnabled()).to.be.false;
    expect(await issueReporterPage.
      isDetailsButtonDisplayed()).to.be.true;
    expect(await issueReporterPage.
      isDetailsButtonEnabled()).to.be.false;
    expect(await issueReporterPage.
      isDoneButtonDisplayed()).to.be.true;
    expect(await issueReporterPage.
      isDoneButtonEnabled()).to.be.false;
    expect(await issueReporterPage.
      isCancelButtonDisplayed()).to.be.true;
    expect(await issueReporterPage.
      isCancelButtonEnabled()).to.be.true;
    expect(await issueReporterPage.
      isContinueButtonDisplayed()).to.be.true;
    expect(await issueReporterPage.
      isContinueButtonEnabled()).to.be.false;
    await issueReporterPage.clickPrivacyPolicyLink();
    await issueReporterPage.switchToPrivacyPolicyTab();
    expect(await issueReporterPage.getCurrentUrl()).to.equal(
      dataIssueReporter.privacyPolicyUrl);
  });

  it("should close issue reporter", async function()
  {
    const issueReporterPage = new IssueReporterPage(browser);
    const tabId = await issueReporterPage.getABPOptionsTabId();
    await browser.url(dataIssueReporter.testPageUrl);
    await issueReporterPage.init(globalOrigin, tabId);
    await issueReporterPage.clickCancelButton();
    try
    {
      await issueReporterPage.clickCancelButton();
    }
    catch (NoSuchWindowException)
    {
      expect(NoSuchWindowException.toString()).to.include(
        "no such window: target window already closed");
    }
  });

  it("should send an issue report", async function()
  {
    const issueReporterPage = new IssueReporterPage(browser);
    const tabId = await issueReporterPage.getABPOptionsTabId();
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
    await issueReporterPage.switchToIssueReportLoadingTab();
    const issueReportPage = new IssueReportPage(browser);
    expect(await issueReportPage.getReportBeingProcessedText()).to.include(
      dataIssueReporter.reportBeingProcessedText);
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

  it("should contain issue report data", async function()
  {
    const issueReporterPage = new IssueReporterPage(browser);
    const tabId = await issueReporterPage.getABPOptionsTabId();
    await browser.url(dataIssueReporter.testPageUrl);
    await issueReporterPage.init(globalOrigin, tabId);
    await issueReporterPage.clickIStillSeeAdsButton();
    await issueReporterPage.clickContinueButton();
    await issueReporterPage.clickContinueButton();
    await issueReporterPage.clickAnonymousSubmissionCheckbox();
    await issueReporterPage.clickShowReportDataButton();
    expect(await issueReporterPage.getShowDataValueText()).to.include(
      '<report type="false negative">');
    expect(await issueReporterPage.getShowDataValueText()).to.include(
      "<requests>");
    dataIssueReporter.requestData.forEach(async(tag) =>
    {
      expect(await issueReporterPage.getShowDataValueText()).to.include(tag);
    });
    expect(await issueReporterPage.getShowDataValueText()).to.include(
      "<filters>");
    dataIssueReporter.filterData.forEach(async(tag) =>
    {
      expect(await issueReporterPage.getShowDataValueText()).to.include(tag);
    });
    expect(await issueReporterPage.getShowDataValueText()).to.include(
      "<platform");
    expect(await issueReporterPage.getShowDataValueText()).to.include(
      "<subscriptions>");
    dataIssueReporter.subscriptionsRegex.forEach(async(regex) =>
    {
      expect(await issueReporterPage.getShowDataValueText()).to.match(regex);
    });
    expect(await issueReporterPage.getShowDataValueText()).to.include(
      "<adblock-plus");
    expect(await issueReporterPage.getShowDataValueText()).to.include(
      "<application");
    expect(await issueReporterPage.getShowDataValueText()).to.include(
      '<screenshot edited="false">');
    expect(await issueReporterPage.getShowDataValueText()).to.not.include(
      "<extensions>");
    expect(await issueReporterPage.getShowDataValueText()).to.not.include(
      "<options>");
    expect(await issueReporterPage.getShowDataValueText()).to.not.include(
      "<comment>");
    expect(await issueReporterPage.getShowDataValueText()).to.not.include(
      "<email>");
  });

  it("should contain issue reporter data settings", async function()
  {
    lastTest = true;
    const issueReporterPage = new IssueReporterPage(browser);
    const tabId = await issueReporterPage.getABPOptionsTabId();
    await browser.url(dataIssueReporter.testPageUrl);
    await issueReporterPage.init(globalOrigin, tabId);
    await issueReporterPage.clickPageIsBrokenButton();
    await issueReporterPage.clickContinueButton();
    await issueReporterPage.clickContinueButton();
    await issueReporterPage.typeTextToEmailTextbox(
      "test@adblock.org");
    await issueReporterPage.typeTextToCommentTextbox(
      "testing");
    await issueReporterPage.clickShowReportDataButton();
    expect(await issueReporterPage.getShowDataValueText()).to.include(
      "<email>\n    test@adblock.org\n  </email>");
    expect(await issueReporterPage.getShowDataValueText()).to.include(
      "<comment>\n    testing\n  </comment>");
  });
});
