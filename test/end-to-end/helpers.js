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
const BasePage = require("./page-objects/base.page");
const helperExtension = "helper-extension";
const globalRetriesNumber = 2;

async function afterSequence()
{
  await browser.reloadSession();
}

async function beforeSequence()
{
  if (browser.capabilities.browserName == "firefox")
  {
    const abpXpiFileName = getFirefoxExtensionPath();
    const abpExtensionXpi = await fs.promises.readFile(abpXpiFileName);
    const helperExtensionZip = await fs.promises.
      readFile("helper-extension/helper-extension.zip");
    await browser.installAddOn(helperExtensionZip.toString("base64"), true);
    await browser.installAddOn(abpExtensionXpi.toString("base64"), true);
  }
  const [origin] = await waitForExtension();
  await browser.url(`${origin}/desktop-options.html`);
  await browser.setWindowSize(1400, 1000);
  return [origin];
}

function getChromiumExtensionPath()
{
  const extensionPath = "../../adblockpluschrome/devenv.chrome";
  return extensionPath;
}

function getFirefoxExtensionPath()
{
  let abpXpiFileName;
  const files = fs.readdirSync("../../adblockpluschrome");
  files.forEach(async(name) =>
  {
    if (/.*\.xpi/.test(name))
    {
      abpXpiFileName = "../../adblockpluschrome/" + name;
    }
  });
  return abpXpiFileName;
}

async function waitForExtension()
{
  let origin;
  const basePage = new BasePage(browser);
  await basePage.switchToTab("Adblock Plus Options");
  await browser.waitUntil(async() =>
  {
    for (const handle of await browser.getWindowHandles())
    {
      await browser.switchToWindow(handle);
      origin = await browser.executeAsyncScript(`
        let callback = arguments[arguments.length - 1];
        (async() =>
        {
          if (typeof browser != "undefined")
          {
            let info = await browser.management.getSelf();
            if (info.optionsUrl)
            {
              callback(location.origin);
              return;
            }
          }
          callback(null);
        })();`, []);
      if (origin)
        return true;
    }
    return false;
  }, {timeout: 5000}, "options page not found");

  return [origin];
}

module.exports = {afterSequence, beforeSequence,
                  getChromiumExtensionPath, getFirefoxExtensionPath,
                  helperExtension, globalRetriesNumber, waitForExtension};
