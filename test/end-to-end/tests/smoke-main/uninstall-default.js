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

const GeneralPage = require("../../page-objects/general.page");
const checkInstallUninstallUrl =
  require("./shared/check-install-uninstall-url");

module.exports = function()
{
  before(function()
  {
    this.test.parent.parent.lastTest = true;
  });

  it("uninstalls the extension with default settings", async function()
  {
    const generalPage = new GeneralPage(browser);
    const appVersion = await browser.
      executeScript("return browser.runtime.getManifest().version;", []);

    await browser.executeScript("browser.management.uninstallSelf();", []);
    await generalPage.switchToUninstalledTab();

    const url = await browser.getUrl();
    expect(url).to.have.string("https://adblockplus.org/en/uninstalled");
    await checkInstallUninstallUrl(url, appVersion);
  });
};
