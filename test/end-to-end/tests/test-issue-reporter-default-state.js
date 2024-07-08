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

  it("should display issue reporter default state", async function()
  {
    const issueReporterPage = new IssueReporterPage(browser);
    const tabId = await getABPOptionsTabId();
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
    if (!(await issueReporterPage.getCurrentUrl()).includes("privacy"))
    {
      await issueReporterPage.switchToPrivacyPolicyTab();
      await browser.pause(1000);
    }
    expect(await issueReporterPage.getCurrentUrl()).to.equal(
      dataIssueReporter.privacyPolicyUrl);
  });
});
