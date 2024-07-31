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

const helpers = require("./helpers.js");
helpers.lambdatestRunChecks();

const {config: baseConfig} = require("./base.conf.js");
const {config: localisationConfig} = require("./localisation.conf.js");
const mv3BuildCloudUrl = process.env.MV3_BUILD_CLOUD_URL;

process.env.MANIFEST_VERSION = "3";

const parallelConfig = {
  maxInstances: 12,
  commonCapabilities: {
    "LT:Options": {
      build: baseConfig.buildNumber
    }
  },
  capabilities: [
    {
      "LT:Options": {
        "lambda:loadExtension": [mv3BuildCloudUrl]
      },
      browserName: "Chrome",
      browserVersion: "latest",
      platformName: "macOS Monterey",
      "goog:chromeOptions": {
        extensions: [
          helpers.getHelperExtension()
        ],
        args: ["--no-sandbox"],
        prefs: {
          "intl.accept_languages": "en,en_US",
          "profile.managed_default_content_settings.popups": 2,
          "profile.managed_default_content_settings.notifications": 2,
          "profile.content_settings.exceptions.clipboard": {
            "*": {"setting": 1}
          }
        },
        excludeSwitches: ["disable-extensions"]
      },
      acceptInsecureCerts: true,
      exclude: [
        "./tests/legacy-unit.js",
        "./tests/localisation-*.js"
      ]
    },
    {
      "LT:Options": {
        "lambda:loadExtension": [mv3BuildCloudUrl]
      },
      browserName: "MicrosoftEdge",
      browserVersion: "latest",
      platformName: "Windows 11",
      "ms:edgeOptions": {
        extensions: [
          helpers.getHelperExtension()
        ],
        args: ["--no-sandbox", "--start-maximized"],
        prefs: {
          "intl.accept_languages": "en,en_US",
          "profile.managed_default_content_settings.popups": 2,
          "profile.managed_default_content_settings.notifications": 2,
          "profile.content_settings.exceptions.clipboard": {
            "*": {"setting": 1}
          }
        },
        excludeSwitches: ["disable-extensions"]
      },
      acceptInsecureCerts: true,
      exclude: [
        "./tests/legacy-unit.js",
        "./tests/localisation-*.js",
        "./tests/test-abp-premium-license-check-retries.js",
        "./tests/test-abp-premium-license-server-responses.js"
      ]
    }
  ],
  logLevel: "error",
  coloredLogs: true,
  screenshotPath: "./errorShots/"
};

exports.config = {...baseConfig, ...parallelConfig,
                  capabilities: [...parallelConfig.capabilities, ...localisationConfig.capabilities]};

// Code to support common capabilities
exports.config.capabilities.forEach((caps) =>
{
  for (const i in exports.config.commonCapabilities)
    caps[i] = {...caps[i], ...exports.config.commonCapabilities[i]};
});
