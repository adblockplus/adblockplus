/* eslint-disable quote-props */
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

// const fs = require("fs");
// const helpers = require("./helpers.js");

exports.config = {
  user: process.env.LT_USERNAME,
  key: process.env.LT_ACCESS_KEY,
  "suites": {
    all: ["./tests/**.js"],
    e2e:
      [
        "./tests/test-advanced-tab-custom-filters.js",
        "./tests/test-advanced-tab-customisations.js",
        "./tests/test-advanced-tab-filter-lists.js",
        "./tests/test-allowlisted-websites-tab.js",
        "./tests/test-client-side-notifications-appearance.js",
        "./tests/test-filter-list-suggestion.js",
        "./tests/test-issue-reporter.js",
        "./tests/test-options-page-acceptable-ads.js",
        "./tests/test-options-page-dialog-links.js",
        "./tests/test-options-page-dialogs.js",
        "./tests/test-options-page-language.js",
        "./tests/test-options-page-links.js",
        "./tests/test-options-page-recommended-filters.js",
        "./tests/test-options-page-tooltips.js",
        "./tests/test-options-page-tracking-warning.js",
        "./tests/test-page-links.js"
      ],
    integration: ["./tests/test-integration-*.js"],
    smoke: ["./tests/test-smoke-*.js"]
  },
  logLevel: "info",
  bail: 0,
  waitforTimeout: 50000,
  connectionRetryTimeout: 300000,
  connectionRetryCount: 3,
  path: "/wd/hub",
  hostname: "hub.lambdatest.com",
  services: [
    ["lambdatest", {
      tunnel: false
    }]
  ],
  framework: "mocha",
  reporters: [["allure", {
    outputDir: "allure-results",
    disableWebdriverStepsReporting: true,
    disableWebdriverScreenshotsReporting: false
  }]],
  mochaOpts: {
    ui: "bdd",
    timeout: 900000
  }
};
