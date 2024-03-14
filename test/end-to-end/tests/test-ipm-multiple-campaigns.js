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

const {beforeSequence, globalRetriesNumber, wakeMockServer,
       executeAsyncScript, doesTabExist, switchToABPOptionsTab,
       waitForCondition} = require("../helpers");
const {expect} = require("chai");
const IPMChunk = require("../page-objects/ipm.chunk");

describe.skip("test ABP IPM multiple campaigns", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should display IPM for multiple campaigns", async function()
  {
    await wakeMockServer("https://qa-mock-ipm-server.glitch.me/",
                         "Mock IPM server is up and running");
    await switchToABPOptionsTab();
    await executeAsyncScript("chrome.runtime.sendMessage({type: " +
      "'prefs.set', key: 'ipm_server_url', value: " +
      "'https://qa-mock-ipm-server.glitch.me/'});");
    await executeAsyncScript("chrome.runtime.sendMessage({type: " +
      "'prefs.set', key: 'installation_id', value: " +
      "'opdmultiplenavigationABP'});");
    await executeAsyncScript("chrome.runtime.sendMessage({type: " +
      "'testing.ping_ipm_server'});");
    await executeAsyncScript("chrome.runtime.sendMessage({type: " +
      "'prefs.set', key: 'installation_id', value: " +
      "'opdmultiplenewtabABP'});");
    await executeAsyncScript("chrome.runtime.sendMessage({type: " +
      "'testing.ping_ipm_server'});");
    await browser.newWindow("about:blank");
    const ipmChunk = new IPMChunk(browser);
    await ipmChunk.switchToTab(/update/);
    expect(await doesTabExist(/update/)).to.be.true;
    await browser.newWindow("https://example.com");
    try
    {
      await ipmChunk.switchToTab(/example/);
      await waitForCondition("isIPMiFrameExisting",
                             10000, ipmChunk, true, 1000);
    }
    catch (Exception)
    {
      await switchToABPOptionsTab();
      await executeAsyncScript("chrome.runtime.sendMessage({type: " +
      "'testing.ping_ipm_server'});");
      await ipmChunk.switchToTab(/example/);
      await waitForCondition("isIPMiFrameExisting", 10000,
                             ipmChunk, true, 1000);
    }
    await ipmChunk.init();
    expect(await ipmChunk.getIPMBodyText()).to.
      include("deviceID: opdmultiplenavigationABP");
  });
});
