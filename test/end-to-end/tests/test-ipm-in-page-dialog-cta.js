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
       executeAsyncScript, doesTabExist, waitForCondition,
       switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const IPMChunk = require("../page-objects/ipm.chunk");

describe("test ABP IPM in page dialog CTA", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should display in page dialog CTA", async function()
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
    try
    {
      await waitForCondition("isIPMiFrameExisting", 10000, ipmChunk, true, 500);
    }
    catch (Exception)
    {
      await switchToABPOptionsTab();
      await executeAsyncScript("browser.runtime.sendMessage({type: " +
      "'testing.ping_ipm_server'});");
      await ipmChunk.switchToTab(/example/);
      await waitForCondition("isIPMiFrameExisting", 10000, ipmChunk, true, 500);
    }
    await ipmChunk.init();
    expect(await ipmChunk.getIPMTitleText()).to.include(
      "OPD was created after navigation to google.com, " +
      "example.com, wikipedia.org");
    expect(await ipmChunk.getIPMBodyText()).to.include(
      "Should only be shown to FREE users, button target is /premium, " +
      "CTA button should be clicked");
    await ipmChunk.clickIPMCTAButton();
    await doesTabExist("https://accounts.adblockplus.org/premium");
  });
});
