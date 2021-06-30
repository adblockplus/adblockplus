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

const {remote} = require("webdriverio");
const {config, helperExtension, getExtensionPath} = require("../wdio.conf");

const capabilities = {
  "browserName": "chrome",
  "goog:chromeOptions": {
    args: ["--no-sandbox",
    `--load-extension=${getExtensionPath()},${helperExtension}`,
    `--disable-extensions-except=${getExtensionPath()},${helperExtension}`],
    excludeSwitches: ["disable-extensions"]
  }
};

async function initDriver()
{
  return remote(Object.assign(config, {capabilities}));
}

module.exports = {initDriver};
