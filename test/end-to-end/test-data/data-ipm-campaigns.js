/* eslint-disable max-len */
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

const ipmCampaignsFreeUsersData = [
  {
    testName: "navigation campaign with no license state",
    command: 'chrome.runtime.sendMessage({type: "prefs.set", key: "installation_id", value: "opdnavigationfreeuserABP"});',
    triggerStep: "https://example.com",
    ipmId: "deviceID: opdnavigationfreeuserABP"
  },
  {
    testName: "navigation campaign with license state premium",
    command: 'chrome.runtime.sendMessage({type: "prefs.set", key: "installation_id", value: "opdnavigationpremiumfreeuserABP"});',
    triggerStep: "https://example.com",
    ipmId: "not present"
  },
  {
    testName: "navigation campaign with excluded domains",
    command: 'chrome.runtime.sendMessage({type: "prefs.set", key: "installation_id", value: "opdnavigationexclusionfreeuserABP"});',
    triggerStep: "https://getadblock.com/en",
    ipmId: "deviceID: opdnavigationexclusionABP"
  },
  // TEST CASES SKIPPED BECAUSE THE UPDATE PAGE DOES NOT CURRENTLY OPEN WITH AUTOMATION
  // {
  //   testName: "new tab campaign with license state: free",
  //   command: 'chrome.runtime.sendMessage({type: "prefs.set", key: "installation_id", value: "newtabfreefreeuserABP"});',
  //   triggerStep: "about:blank",
  //   ipmId: "update page"
  // },
  {
    testName: "new tab campaign with license state: premium",
    command: 'chrome.runtime.sendMessage({type: "prefs.set", key: "installation_id", value: "newtabpremiumfreeuserABP"});',
    triggerStep: "about:blank",
    ipmId: "not present"
  }
  // TEST CASES SKIPPED BECAUSE THE UPDATE PAGE DOES NOT CURRENTLY OPEN WITH AUTOMATION
  // {
  //   testName: "new tab campaign with method: force",
  //   command: 'chrome.runtime.sendMessage({type: "prefs.set", key: "installation_id", value: "newtabforcefreeuserABP"});',
  //   triggerStep: "nothing",
  //   ipmId: "update page"
  // }
];

const ipmCampaignsPremiumUsersData = [
  {
    testName: "navigation campaign with license state: free",
    command: 'chrome.runtime.sendMessage({type: "prefs.set", key: "installation_id", value: "opdnavigationfreepremiumuserABP"});',
    triggerStep: "https://example.com",
    ipmId: "not present"
  },
  {
    testName: "new tab campaign with no license state",
    command: 'chrome.runtime.sendMessage({type: "prefs.set", key: "installation_id", value: "newtabpremiumuserABP"});',
    triggerStep: "about:blank",
    ipmId: "not present"
  }
  // TEST CASES SKIPPED BECAUSE THE UPDATE PAGE DOES NOT CURRENTLY OPEN WITH AUTOMATION
  // {
  //   testName: "new tab campaign with license state: premium",
  //   command: 'chrome.runtime.sendMessage({type: "prefs.set", key: "installation_id", value: "newtabpremiumpremiumuserABP"});',
  //   triggerStep: "about:blank",
  //   ipmId: "update page"
  // }
];

exports.ipmCampaignsFreeUsersData = ipmCampaignsFreeUsersData;
exports.ipmCampaignsPremiumUsersData = ipmCampaignsPremiumUsersData;
