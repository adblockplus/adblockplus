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

const {beforeSequence, globalRetriesNumber, wakeMockServer, executeAsyncScript,
       switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const AdvancedPage = require("../page-objects/advanced.page");
const IPMChunk = require("../page-objects/ipm.chunk");

describe("test preferences - show useful notifications", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should display useful notification", async function()
  {
    await wakeMockServer("https://qa-mock-ipm-server.glitch.me/",
                         "Mock IPM server is up and running");
    try
    {
      await switchToABPOptionsTab();
    }
    catch (Exception) {}
    await executeAsyncScript("browser.runtime.sendMessage({type: 'prefs.set'" +
      ", key: 'ipm_server_url', value: " +
      "'https://qa-mock-ipm-server.glitch.me/'});");
    await executeAsyncScript("browser.runtime.sendMessage({type: 'prefs.set'" +
      ", key: 'installation_id', value: 'opdnavigationctaABP'});");
    await executeAsyncScript("browser.runtime.sendMessage({type: " +
      "'testing.ping_ipm_server'});");
    const ipmChunk = new IPMChunk(browser);
    await browser.newWindow("https://example.com");
    await ipmChunk.switchToTab(/example/);
    expect(await ipmChunk.isIPMDialogDisplayed()).to.be.true;
    await browser.closeWindow();
    await switchToABPOptionsTab();
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isShowUsefulNotificationsCheckboxSelected()).to.be.true;
    await advancedPage.clickShowUsefulNotificationsCheckbox();
    expect(await advancedPage.
      isShowUsefulNotificationsCheckboxSelected()).to.be.false;
    await executeAsyncScript("browser.runtime.sendMessage({type: 'prefs.set'" +
      ", key: 'installation_id', value: 'opdnavigationsubdomainABP'});");
    await executeAsyncScript("browser.runtime.sendMessage({type: " +
      "'testing.ping_ipm_server'});");
    await browser.newWindow("https://example.com");
    await ipmChunk.switchToTab(/example/);
    expect(await ipmChunk.isIPMDialogDisplayed()).to.be.false;
  });
});
