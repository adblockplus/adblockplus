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

const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome.js");
const {execFile} = require("child_process");
const {promisify} = require("util");
const path = require("path");
const argv = require("minimist")(process.argv.slice(2));

const helperExtension = "test/end-to-end/helper-extension";

async function ensureDriver()
{
  if (process.env.DETECT_CHROMEDRIVER_VERSION)
    return;

  process.env.DETECT_CHROMEDRIVER_VERSION = true;
  await promisify(execFile)(
    process.execPath,
    [path.join("node_modules", "chromedriver", "install.js")],
    process.env
  );
}

async function initDriver()
{
  await ensureDriver();
  const options = new chrome.Options()
    .addArguments("--no-sandbox")
    .addArguments(`load-extension=${getExtensionPath()},${helperExtension}`);

  return new webdriver.Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
}

function getExtensionPath()
{
  const extensionPath = argv.path || argv.p;
  if (!extensionPath)
  {
    console.error("Extension path is missing");
    process.exit(1);
  }
  return extensionPath;
}

module.exports = {initDriver};
