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

const fs = require("fs");
const helpers = require("./helpers.js");

exports.config = {
  specs: [
    "./tests/**.js"
  ],
  maxInstances: 5,
  capabilities: [
    {
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
    },
    {
      browserName: "firefox",
      acceptInsecureCerts: true,
      exclude: [
        "./tests/test-issue-reporter.js",
        "./tests/legacy-unit.js"
      ]
    },
    {
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
    }
  ],
  logLevel: "info",
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 12000,
  connectionRetryCount: 3,
  services: ["geckodriver", "selenium-standalone"],
  framework: "mocha",
  reporters: [["allure", {
    outputDir: "allure-results",
    disableWebdriverStepsReporting: true,
    disableWebdriverScreenshotsReporting: false
  }]],
  mochaOpts: {
    ui: "bdd",
    timeout: 900000
  },
  /**
     * Gets executed once before all workers get launched.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
  */
  onPrepare(config, capabilities)
  {
    const browserList = [];
    for (const property in capabilities)
    {
      browserList.push(capabilities[property]["browserName"]);
    }

    if (browserList.includes("chrome") || browserList.includes("MicrosoftEdge"))
    {
      const extensionPath = helpers.getChromiumExtensionPath();
      if (!fs.existsSync(extensionPath))
      {
        console.error("Extension 'adblockpluschrome/devenv.chrome' does not exist");
        process.exit(1);
      }
    }

    if (browserList.includes("firefox"))
    {
      const extensionPath = helpers.getFirefoxExtensionPath();
      if (!fs.existsSync(extensionPath))
      {
        console.error("Extension 'adblockpluschrome/*.xpi' does not exist");
        process.exit(1);
      }
    }
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
