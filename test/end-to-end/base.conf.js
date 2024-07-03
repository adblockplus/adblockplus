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

const {suites} = require("./suites.js");
const commitHash = require("child_process")
  .execSync("git rev-parse --short HEAD")
  .toString().trim();

const buildNumber = process.env.CI_COMMIT_SHORT_SHA ? process.env.CI_COMMIT_SHORT_SHA : `local-run-${commitHash}`;

exports.config = {
  buildNumber,
  user: process.env.LT_USERNAME,
  key: process.env.LT_ACCESS_KEY,
  suites,
  logLevel: "error",
  logLevels: {
    webdriver: "silent"
  },
  bail: 0,
  waitforTimeout: 50000,
  connectionRetryTimeout: 300000,
  connectionRetryCount: 3,
  path: "/wd/hub",
  hostname: "hub-virginia.lambdatest.com",
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
