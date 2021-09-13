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

const BasePage = require("./page-objects/base.page");
const helperExtension = "helper-extension";

function getExtensionPath()
{
  const extensionPath = "../../adblockpluschrome/devenv.chrome";
  if (!extensionPath)
  {
    console.error("Extension path is missing");
    process.exit(1);
  }
  return extensionPath;
}

async function waitForExtension()
{
  let extensionHandle;
  let origin;
  const basePage = new BasePage(browser);
  await basePage.switchToTab("Adblock Plus Options");
  await browser.waitUntil(async() =>
  {
    for (const handle of await browser.getWindowHandles())
    {
      await browser.switchToWindow(handle);
      extensionHandle = handle;
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

  return [origin, extensionHandle];
}

module.exports = {getExtensionPath, helperExtension, waitForExtension};
