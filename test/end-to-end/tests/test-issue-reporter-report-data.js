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

const {beforeSequence, getABPOptionsTabId,
       globalRetriesNumber} = require("../helpers");
const {expect} = require("chai");
const IssueReporterPage = require("../page-objects/issueReporter.page");
const dataIssueReporter = require("../test-data/data-issue-reporter");
let globalOrigin;

describe("test issue reporter", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    ({origin: globalOrigin} = await beforeSequence());
  });

  it("should contain issue report data", async function()
  {
    const issueReporterPage = new IssueReporterPage(browser);
    const tabId = await getABPOptionsTabId();
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
});
