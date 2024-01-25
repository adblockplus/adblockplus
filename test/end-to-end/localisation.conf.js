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

exports.config = {
  capabilities: [
    {
      browserName: "Chrome",
      browserVersion: "latest",
      platformName: "Windows 10",
      "goog:chromeOptions": {
        extensions: [
          helpers.getChromiumExtensionPath(),
          require("fs").readFileSync("helper-extension/helper-extension.zip").toString("base64")
        ],
        args: ["--no-sandbox", "--lang=de"],
        prefs: {
          "intl.accept_languages": "de-DE",
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
        "./tests/test-*.js",
        "./tests/legacy-unit.js",
        "./tests/localisation-test-ui-localisation-ar.js"
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
        args: ["--no-sandbox", "--start-maximized", "--lang=de"],
        prefs: {
          "intl.accept_languages": "de,DE",
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
        "./tests/test-*.js",
        "./tests/legacy-unit.js",
        "./tests/localisation-test-ui-localisation-ar.js"
      ]
    },
    {
      browserName: "Chrome",
      browserVersion: "latest-1",
      platformName: "Windows 10",
      "goog:chromeOptions": {
        extensions: [
          helpers.getChromiumExtensionPath(),
          require("fs").readFileSync("helper-extension/helper-extension.zip").toString("base64")
        ],
        args: ["--no-sandbox", "--lang=ar_SA"],
        prefs: {
          "intl.accept_languages": "ar_SA",
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
        "./tests/test-*.js",
        "./tests/legacy-unit.js",
        "./tests/localisation-test-extension-initialization.js",
        "./tests/localisation-test-feature-localisation.js",
        "./tests/localisation-test-ui-localisation-de.js"
      ]
    },
    {
      browserName: "MicrosoftEdge",
      browserVersion: "latest-1",
      platformName: "Windows 10",
      "ms:edgeOptions": {
        extensions: [
          helpers.getChromiumExtensionPath(),
          require("fs").readFileSync("helper-extension/helper-extension.zip").toString("base64")
        ],
        args: ["--no-sandbox", "--start-maximized", "--lang=ar_SA"],
        prefs: {
          "intl.accept_languages": "ar_SA",
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
        "./tests/test-*.js",
        "./tests/legacy-unit.js",
        "./tests/localisation-test-extension-initialization.js",
        "./tests/localisation-test-feature-localisation.js",
        "./tests/localisation-test-ui-localisation-de.js"
      ]
    },
    {
      browserName: "Chrome",
      browserVersion: "latest-2",
      platformName: "Windows 10",
      "goog:chromeOptions": {
        extensions: [
          helpers.getChromiumExtensionPath(),
          require("fs").readFileSync("helper-extension/helper-extension.zip").toString("base64")
        ],
        args: ["--no-sandbox", "--lang=sl_SI"],
        prefs: {
          "intl.accept_languages": "sl_SI",
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
        "./tests/test-*.js",
        "./tests/legacy-unit.js",
        "./tests/localisation-test-feature-localisation.js",
        "./tests/localisation-test-ui-localisation-*.js"
      ]
    },
    {
      browserName: "MicrosoftEdge",
      browserVersion: "latest-2",
      platformName: "Windows 10",
      "ms:edgeOptions": {
        extensions: [
          helpers.getChromiumExtensionPath(),
          require("fs").readFileSync("helper-extension/helper-extension.zip").toString("base64")
        ],
        args: ["--no-sandbox", "--start-maximized", "--lang=sl_SI"],
        prefs: {
          "intl.accept_languages": "sl_SI",
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
        "./tests/test-*.js",
        "./tests/legacy-unit.js",
        "./tests/localisation-test-feature-localisation.js",
        "./tests/localisation-test-ui-localisation-*.js"
      ]
    }
  ]
};
