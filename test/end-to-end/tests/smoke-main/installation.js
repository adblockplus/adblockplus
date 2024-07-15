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

const {expect} = require("chai");

const checkInstallUninstallUrl =
  require("./shared/check-install-uninstall-url");

module.exports = function()
{
  it("opens the install url", async function()
  {
    // installedUrl is assigned to test context in the before hook
    const {installedUrl} = this.test.parent.parent;
    if (installedUrl.includes("first-run"))
    {
      console.warn(`ABP installation opened first run page: ${installedUrl}`);
      this.skip();
    }

    expect(installedUrl).to.have.string("adblockplus.org/en/installed");

    const appVersion = await browser.
      executeScript("return browser.runtime.getManifest().version;", []);
    await checkInstallUninstallUrl(installedUrl, appVersion);
  });
};
