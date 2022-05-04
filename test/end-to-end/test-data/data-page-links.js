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

const dayOnePageData = [
  {
    testName: "Day 1 - Adblock Plus logo",
    elementToClick: "abpLogo",
    newTabUrl: "https://adblockplus.org/"
  },
  {
    testName: "Day 1 - Learn more about malicious advertising",
    elementToClick: "learnMoreAboutMaliciousAdvertisingButton",
    newTabUrl: "https://help.eyeo.com/adblockplus/adware"
  },
  {
    testName: "Day 1 - Contact us",
    elementToClick: "contactUsButton",
    newTabUrl: "mailto:support@adblockplus.org?subject=" +
    "Looking%20for%20support!"
  },
  {
    testName: "Day 1 - Learn how",
    elementToClick: "learnHowButton",
    newTabUrl: "https://help.eyeo.com/adblockplus/block-item-or-element"
  },
  {
    testName: "Day 1 - eyeo GmbH",
    elementToClick: "eyeoGmbHLink",
    newTabUrl: "https://eyeo.com/"
  }
];

const firstRunPageData = [
  {
    testName: "First run - Adblock Plus logo",
    elementToClick: "abpLogo",
    newTabUrl: "https://adblockplus.org/"
  },
  {
    testName: "First run - Donate",
    elementToClick: "donateButton",
    newTabUrl: "https://adblockplus.org/donate?utm_source=abp&utm_medium" +
    "=frp_page&utm_campaign=donate"
  },
  {
    testName: "First run - strict criteria",
    elementToClick: "strictCriteriaLink",
    newTabUrl: "https://adblockplus.org/en/acceptable-ads#criteria"
  },
  {
    testName: "First run - Turn off Acceptable Ads",
    elementToClick: "turnOffAALink",
    newTabUrl: "https://adblockplus.org/en/acceptable-ads#optout"
  },
  {
    testName: "First run - Settings",
    elementToClick: "settingsLink",
    newTabUrl: "/options.html"
  },
  {
    testName: "First run - App Store",
    elementToClick: "appStoreButton",
    newTabUrl: "https://apps.apple.com/us/app/adblock-browser-" +
    "best-ad-blocker/id1015653330"
  },
  {
    testName: "First run - Google Play",
    elementToClick: "googlePlayButton",
    newTabUrl: "https://play.google.com/store/apps/details" +
    "?id=org.adblockplus.browser"
  },
  {
    testName: "First run - Terms of Use",
    elementToClick: "termsOfUseLink",
    newTabUrl: "https://adblockplus.org/terms"
  },
  {
    testName: "First run - eyeo GmbH",
    elementToClick: "eyeoGmbHLink",
    newTabUrl: "https://eyeo.com/"
  }
];

const problemPageData = [
  {
    testName: "Problem - Adblock Plus logo",
    elementToClick: "abpLogo",
    newTabUrl: "https://adblockplus.org/"
  },
  {
    testName: "Problem - Twitter icon",
    elementToClick: "twitterButton",
    newTabUrl: "https://twitter.com/adblockplus"
  },
  {
    testName: "Problem - Facebook icon",
    elementToClick: "facebookButton",
    newTabUrl: "https://www.facebook.com/adblockplus"
  },
  {
    testName: "Problem - Envelope icon",
    elementToClick: "contactUsButton",
    newTabUrl: "mailto:support@adblockplus.org"
  },
  {
    testName: "Problem - eyeo GmbH",
    elementToClick: "eyeoGmbHLink",
    newTabUrl: "https://eyeo.com/"
  },
  {
    testName: "Problem - Uninstall and reinstall",
    elementToClick: "clickHereToReinstallButton",
    newTabUrlChrome: "https://chrome.google.com/webstore/detail/adblock-" +
    "plus-free-ad-bloc/cfhdojbkjhnklbpkdaibdccddilifddb",
    newTabUrlFirefox: "https://addons.mozilla.org/en-GB/firefox/" +
    "addon/adblock-plus/",
    webstoreCookiesConsentPageTitle: "Before you continue",
    chromeWebstorePageTitle: "Adblock Plus - free ad blocker - " +
    "Chrome Web Store"
  }
];

const updatesPageData = [
  {
    testName: "Updates - Adblock Plus logo",
    elementToClick: "abpLogo",
    newTabUrl: "https://adblockplus.org/"
  },
  {
    testName: "Updates - Contribute",
    elementToClick: "contributeButton",
    newTabUrl: "https://adblockplus.org/donate?utm_source=" +
    "abp&utm_medium=update_page&utm_campaign=donate"
  },
  {
    testName: "Updates - Rate it",
    elementToClick: "rateItButton",
    newTabUrlChrome: "https://chrome.google.com/webstore/detail/adblock-plus" +
    "-free-ad-bloc/cfhdojbkjhnklbpkdaibdccddilifddb/reviews?ref=store-rating",
    newTabUrlFirefox: "https://addons.mozilla.org/en-GB/firefox/" +
    "addon/adblock-plus/",
    webstoreCookiesConsentPageTitle: "Before you continue",
    chromeWebstorePageTitle: "Adblock Plus - free ad blocker - " +
    "Chrome Web Store"
  },
  {
    testName: "Updates - Twitter icon",
    elementToClick: "twitterButton",
    newTabUrl: "https://twitter.com/adblockplus"
  },
  {
    testName: "Updates - Facebook icon",
    elementToClick: "facebookButton",
    newTabUrl: "https://www.facebook.com/adblockplus"
  },
  {
    testName: "Updates - Envelope icon",
    elementToClick: "contactUsButton",
    newTabUrl: "mailto:support@adblockplus.org"
  },
  {
    testName: "Updates - eyeo GmbH",
    elementToClick: "eyeoGmbHLink",
    newTabUrl: "https://eyeo.com/"
  }
];

exports.dayOnePageData = dayOnePageData;
exports.firstRunPageData = firstRunPageData;
exports.problemPageData = problemPageData;
exports.updatesPageData = updatesPageData;
