/* eslint-disable quote-props */
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

const path = require("path");
const fs = require("fs");

const helpers = require("./helpers.js");
const {suites} = require("./suites.js");

const {allureEnabled, browserName, helperExtensionPath,
       screenshotsPath} = helpers.testConfig;
helpers.localRunChecks();

const browserCapabilities = [];
const chromeExtensionPath =
  helpers.getChromiumExtensionPath({isLambdatest: false});
const chromiumOptions = {
  args: [
    "--no-sandbox",
    `--load-extension=${chromeExtensionPath},${helperExtensionPath}`,
    `--disable-extensions-except=${chromeExtensionPath},${helperExtensionPath}`
  ],
  excludeSwitches: ["disable-extensions"]
};

if (browserName === "chrome")
{
  browserCapabilities.push({
    browserName: "chrome",
    "goog:chromeOptions": chromiumOptions,
    acceptInsecureCerts: true,
    exclude: [
      "./tests/legacy-unit.js"
    ]
  });
}
else if (browserName === "firefox")
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
else if (browserName === "edge")
{
  browserCapabilities.push({
    browserName: "MicrosoftEdge",
    "ms:edgeOptions": chromiumOptions,
    acceptInsecureCerts: true,
    exclude: [
      "./tests/test-issue-reporter.js",
      "./tests/legacy-unit.js"
    ]
  });
}

exports.config = {
  suites,
  maxInstances: Number(process.env.MAX_INSTANCES) || 1,
  capabilities: browserCapabilities,
  logLevel: "error",
  logLevels: {
    webdriver: "silent",
    "@wdio/local-runner": "silent"
  },
  bail: 0,
  waitforTimeout: 10000,
  // connectionRetryTimeout is used on the initial browser instance loading
  connectionRetryTimeout: 20000,
  connectionRetryCount: 3,
  framework: "mocha",
  reporters: allureEnabled ? [["allure", {
    outputDir: "allure-results",
    disableWebdriverStepsReporting: true,
    disableWebdriverScreenshotsReporting: false
  }]] : [["spec", {
    realtimeReporting: true,
    showPreface: false
  }]],
  mochaOpts: {
    ui: "bdd",
    timeout: 900000
  },
  async before()
  {
    await fs.promises.mkdir(screenshotsPath, {recursive: true});
    // eslint-disable-next-line no-console
    console.log(`MANIFEST_VERSION=${process.env.MANIFEST_VERSION}`);
  },
  async afterTest(test, context, {error})
  {
    if (!error)
      return;

    try
    {
      const filename = `${test.title.replaceAll(" ", "_")}.png`;
      await browser.saveScreenshot(path.join(screenshotsPath, filename));
    }
    catch (err)
    {
      console.warn(`Screenshot could not be saved: ${err}`);
    }
  }
};
