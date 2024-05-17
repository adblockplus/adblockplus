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

process.env.MANIFEST_VERSION = 2;

const parallelConfig = {
  maxInstances: 12,
  commonCapabilities: {
    "LT:Options": {
      build: baseConfig.buildNumber
    }
  },
  capabilities: [
    {
      browserName: "Firefox",
      browserVersion: "latest",
      platformName: "Windows 10",
      "moz:firefoxOptions": {
        args: ["--no-sandbox"],
        prefs: {
          "permissions.default.geo": 2
        }
      },
      acceptInsecureCerts: true,
      exclude: [
        "./tests/test-issue-reporter-*.js",
        "./tests/legacy-unit.js",
        "./tests/localisation-*.js",
        "./tests/test-abp-premium-license-check-retries.js",
        "./tests/test-abp-premium-license-server-responses.js",
        "./tests/test-ipm-*.js"
      ]
    },
    {
      browserName: "MicrosoftEdge",
      browserVersion: "latest",
      platformName: "Windows 10",
      "ms:edgeOptions": {
        extensions: [
          helpers.getChromiumExtensionPath(),
          require("fs").readFileSync("helper-extension/helper-extension.zip").toString("base64")
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
                  capabilities: [...parallelConfig.capabilities]};

// Code to support common capabilities
exports.config.capabilities.forEach((caps) =>
{
  for (const i in exports.config.commonCapabilities)
    caps[i] = {...caps[i], ...exports.config.commonCapabilities[i]};
});
