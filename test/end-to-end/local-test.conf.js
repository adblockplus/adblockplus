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

require("dotenv").config({path: "../../.env.e2e"});
const fs = require("fs");
const helpers = require("./helpers.js");

const allureEnabled = process.env.ENABLE_ALLURE === "true";
const chromeEnabled = process.env.ENABLE_CHROME === "true";
const firefoxEnabled = process.env.ENABLE_FIREFOX === "true";
const edgeEnabled = process.env.ENABLE_EDGE === "true";

checkBuilds();

const browserCapabilities = [];
const specs = [
  "./tests/*.js"
];


if (chromeEnabled)
{
  browserCapabilities.push({
    browserName: "chrome",
    "goog:chromeOptions": {
      args: ["--no-sandbox",
              `--load-extension=${helpers.getChromiumExtensionPath()},${helpers.helperExtension}`,
              `--disable-extensions-except=${helpers.getChromiumExtensionPath()},${helpers.helperExtension}`],
      excludeSwitches: ["disable-extensions"]
    },
    acceptInsecureCerts: true,
    exclude: [
      "./tests/legacy-unit.js"
    ]
  });
}

if (firefoxEnabled)
{
  browserCapabilities.push({
    browserName: "firefox",
    acceptInsecureCerts: true,
    exclude: [
      "./tests/test-issue-reporter.js",
      "./tests/legacy-unit.js"
    ]
  });
}

if (edgeEnabled)
{
  browserCapabilities.push({
    browserName: "MicrosoftEdge",
    "ms:edgeOptions": {
      args: ["--no-sandbox",
              `--load-extension=${helpers.getChromiumExtensionPath()},${helpers.helperExtension}`,
              `--disable-extensions-except=${helpers.getChromiumExtensionPath()},${helpers.helperExtension}`],
      excludeSwitches: ["disable-extensions"]
    },
    acceptInsecureCerts: true,
    exclude: [
      "./tests/test-issue-reporter.js",
      "./tests/legacy-unit.js"
    ]
  });
}

exports.config = {
  specs,
  maxInstances: Number(process.env.MAX_INSTANCES) || 1,
  capabilities: browserCapabilities,
  logLevel: "info",
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 12000,
  connectionRetryCount: 3,
  framework: "mocha",
  reporters: allureEnabled ? [["allure", {
    outputDir: "allure-results",
    disableWebdriverStepsReporting: true,
    disableWebdriverScreenshotsReporting: false
  }]] : [],
  mochaOpts: {
    ui: "bdd",
    timeout: 900000
  },
  /**
     * Function to be executed after a test (in Mocha/Jasmine only)
     * @param {Object}  test             test object
     * @param {Object}  context          scope object the test was executed with
     * @param {Error}   result.error     error object in case the test fails, otherwise `undefined`
     * @param {Any}     result.result    return object of test function
     * @param {Number}  result.duration  duration of test
     * @param {Boolean} result.passed    true if test has passed, otherwise false
     * @param {Object}  result.retries   informations to spec related retries, e.g. `{ attempts: 0, limit: 0 }`
     */
  afterTest(
    test,
    context,
    {error, result, duration, passed, retries}
  )
  {
    if (error)
    {
      browser.takeScreenshot();
    }
  }
};


function checkBuilds()
{
  if (chromeEnabled || edgeEnabled)
  {
    const extensionPath = helpers.getChromiumExtensionPath();
    if (!fs.existsSync(extensionPath))
    {
      console.error("\x1b[33m%s\x1b[0m", `
-----------------------------------------------------------------
Could not find chrome extension in 'dist/devenv/chrome'.
Run 'npm run build:dev chrome' to build the MV2 extension.
Or 'npm run build:dev chrome -- -m 3' to build the MV3 extension.
-----------------------------------------------------------------
      `);
      process.exit(1);
    }
  }

  if (firefoxEnabled)
  {
    const extensionDirectoryPath = "../../dist/release";
    if (!fs.existsSync(extensionDirectoryPath) || !fs.existsSync(helpers.getFirefoxExtensionPath()))
    {
      console.error("\x1b[33m%s\x1b[0m", `
-----------------------------------------------------------------
Could not find firefox extension in 'dist/release/*.xpi'.
Run 'npm run build:release firefox' to build it
-----------------------------------------------------------------
      `);
      process.exit(1);
    }
  }
}
