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

module.exports =
{
  commentLabelText: "Comment:",
  commentText: "TESTING, ignore report.",
  emailLabelText: "Email:",
  emailText: "********@a******.o*****",
  filterData:
  [
    '<filter text="/awe2.js" subscriptions="h' +
    'ttps://easylist-downloads.adblockplus.org/easylist.txt" hitCount="1"/>',
    '<filter text="/bannerads/*" subscriptions="https://easylist-downlo' +
    'ads.adblockplus.org/easylist.txt" hitCount="2"/>',
    '<filter text="###search-ad" subscriptions="https://easylist-downloads.a' +
    'dblockplus.org/easylist.txt" hitCount="1"/>',
    '<filter text="##.AdContainer" subscriptions="https' +
    '://easylist-downloads.adblockplus.org/easylist.txt" hitCount="1"/>'
  ],
  issueTypeLableText: "Issue type:",
  issueTypeText: "False positive",
  otherIssuesText: "For all other issues, please contact us via " +
    "support@adblockplus.org.",
  privacyPolicyUrl: "https://adblockplus.org/en/privacy#issue-reporter?link=" +
    "reporter_privacy&lang=en-US",
  reportBeingProcessedText: "Please wait, the report is being processed. " +
    "This will usually take at most 1 minute. You do not need to reload this" +
    " page, it will reload automatically.",
  testPageUrl: "https://adblockinc.gitlab.io/QA-team/issue-reporter/" +
    "issue-reporter-testpage.html",
  topNoteText: "Note: An additional tab will temporarily open so the " +
    "page you are on won't be affected by the Issue Reporter.",
  requestData:
  [
    '<request location="https://adblockinc.gitlab.io/QA-team/issue-reporter/' +
    'issue-reporter-testpage.html" type="DOCUMENT" docDomain="null" thirdPar' +
    'ty="undefined" count="3" filter="##.AdContainer"/>',
    '<request location="https://adblockinc.gitlab.io/QA-team/issue-reporter/' +
    'scripts/awe2.js" type="SCRIPT" docDomain="adblockinc.gitlab.io" ' +
    'thirdParty="undefined" count="1" filter="/awe2.js"/>',
    '<request location="https://adblockinc.gitlab.io/QA-team/issue-reporter/' +
    'scripts/bannerads/blocking-filter.js" type="SCRIPT" docDomain="adblocki' +
    'nc.gitlab.io" thirdParty="undefined" count="1" filter="/bannerads/*"/>',
    '<request location="https://adblockinc.gitlab.io/QA-team/style.css" type' +
    '="STYLESHEET" docDomain="adblockinc.gitlab.io" thirdParty="undefined" c' +
    'ount="1"/>',
    '<request location="https://adblockinc.gitlab.io/QA-team/issue-reporter/' +
    'scripts/bannerads/blocking-filter2.js" type="SCRIPT" docDomain="adblock' +
    'inc.gitlab.io" thirdParty="undefined" count="1" filter="/bannerads/*"/>',
    '<request location="https://gitlab.com/users/sign_in" type="IMAGE" docDo' +
    'main="adblockinc.gitlab.io" thirdParty="undefined" count="1"/>'
  ],
  savedReportText: "Your report has been saved. You can access it at " +
    "the following address",
  statusCellLabelText: "Status:",
  statusCellText: "unknown",
  subscriptionsRegex:
  [
    /<subscription id="https:\/\/easylist-downloads\.adblockplus\.org\/easylist\.txt" version="\d*" lastDownloadAttempt=".*" lastDownloadSuccess=".*" softExpiration="\d*" hardExpiration="\d*" downloadStatus="synchronize_ok" disabledFilters="0"\/>/,
    /<subscription id="https:\/\/easylist-downloads\.adblockplus\.org\/abp-filters-anti-cv\.txt" version="\d*" lastDownloadAttempt=".*" lastDownloadSuccess=".*" softExpiration="\d*" hardExpiration="\d*" downloadStatus="synchronize_ok" disabledFilters="0"\/>/,
    /<subscription id="https:\/\/easylist-downloads\.adblockplus\.org\/exceptionrules\.txt" version="\d*" lastDownloadAttempt=".*" lastDownloadSuccess=".*" softExpiration="\d*" hardExpiration="\d*" downloadStatus="synchronize_ok" disabledFilters="0"\/>/
  ],
  timeCellText: "Time:",
  websiteLabelText: "Website:",
  websiteCellHref: "https://adblockinc.gitlab.io/QA-team/issue-" +
    "reporter/issue-reporter-testpage.html"
};
