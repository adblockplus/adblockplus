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

const {beforeSequence, doesTabExist, enablePremiumByMockServer,
       globalRetriesNumber,
       isFirefox} = require("../helpers");
const {expect} = require("chai");
const ExtensionsPage = require("../page-objects/extensions.page");
let appVersion;
let globalOrigin;

describe("test update page", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    ({origin: globalOrigin} = await beforeSequence());
    appVersion = await browser.
      executeScript("return browser.runtime.getManifest().version;", []);
  });

  it("should not display update page for Chrome and Edge", async function()
  {
    if (isFirefox())
      this.skip();
    const extensionsPage = new ExtensionsPage(browser);
    await extensionsPage.init();
    await extensionsPage.clickReloadExtensionButton();
    await browser.newWindow("about:blank");
    // Wait for 15 seconds as a step in the test case
    await browser.pause(15000);
    expect(await doesTabExist(/update/)).to.be.false;
  });

  it("should display update page for free Firefox user", async function()
  {
    if (!isFirefox())
      this.skip();
    const extensionsPage = new ExtensionsPage(browser);
    await extensionsPage.init();
    await extensionsPage.clickReloadExtensionButton();
    // Wait for 15 seconds as a step in the test case
    await browser.pause(15000);
    expect(await doesTabExist(/update/)).to.be.false;
    await browser.newWindow("about:blank");
    // Wait for 15 seconds as a step in the test case
    await browser.pause(15000);
    expect(await doesTabExist(/update/)).to.be.true;
    await extensionsPage.switchToTab(/update/);
    const currentUrl = await extensionsPage.getCurrentUrl();
    const url = new URL(currentUrl);
    const params = url.searchParams;
    expect(params.get("an")).to.equal("adblockplusfirefox");
    expect(params.get("ap")).to.equal("firefox");
    expect(params.get("av")).to.equal(appVersion);
    expect(params.get("p")).to.equal("gecko");
    await browser.closeWindow();
    await extensionsPage.switchToTab(/about/);
    await browser.newWindow("about:blank");
    // Wait for 15 seconds as a step in the test case
    await browser.pause(15000);
    expect(await doesTabExist(/update/)).to.be.false;
  });

  it("should not display update page for premium Firefox user", async function()
  {
    if (!isFirefox())
      this.skip();
    await browser.newWindow("about:blank");
    await browser.url(`${globalOrigin}/desktop-options.html`);
    await enablePremiumByMockServer();
    const extensionsPage = new ExtensionsPage(browser);
    await extensionsPage.init();
    await extensionsPage.clickReloadExtensionButton();
    await browser.newWindow("about:blank");
    // Wait for 15 seconds as a step in the test case
    await browser.pause(15000);
    expect(await doesTabExist(/update/)).to.be.false;
  });
});
