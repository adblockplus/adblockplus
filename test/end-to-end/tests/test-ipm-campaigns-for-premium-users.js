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

const {afterSequence, beforeSequence, globalRetriesNumber, wakeMockServer,
       executeAsyncScript, doesTabExist, switchToABPOptionsTab,
       enablePremiumByMockServer} = require("../helpers");
const {expect} = require("chai");
const IPMChunk = require("../page-objects/ipm.chunk");
const ipmCampaignsData =
  require("../test-data/data-ipm-campaigns").ipmCampaignsPremiumUsersData;
let lastTest = false;

describe("test ABP IPM campaigns for premium users", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
    await enablePremiumByMockServer();
  });

  beforeEach(async function()
  {
    await wakeMockServer("https://qa-mock-ipm-server.glitch.me/",
                         "Mock IPM server is up and running");
    await switchToABPOptionsTab();
    await executeAsyncScript("chrome.runtime.sendMessage({type: " +
      "'prefs.set', key: 'ipm_server_url', value: " +
      "'https://qa-mock-ipm-server.glitch.me/'});");
  });

  afterEach(async function()
  {
    if (lastTest == false)
    {
      await afterSequence();
    }
  });

  ipmCampaignsData.forEach(async(dataSet) =>
  {
    it("should display IPM for " + dataSet.testName, async function()
    {
      try
      {
        await switchToABPOptionsTab();
      }
      catch (Exception) {}
      await executeAsyncScript(dataSet.command);
      await executeAsyncScript("chrome.runtime.sendMessage({type: " +
        "'testing.ping_ipm_server'});");
      await browser.newWindow(dataSet.triggerStep);
      const ipmChunk = new IPMChunk(browser);
      if (dataSet.testName.includes("license state: free"))
      {
        await ipmChunk.switchToTab(dataSet.triggerStep);
        expect(await ipmChunk.isIPMiFrameExisting()).to.be.false;
      }
      else if (dataSet.testName.includes("no license"))
      {
        await ipmChunk.switchToTab(/about/);
        expect(await ipmChunk.isIPMiFrameExisting()).to.be.false;
        expect(await doesTabExist(/update/)).to.be.false;
      }
      else
      {
        lastTest = true;
        await ipmChunk.switchToTab(/update/);
        expect(await doesTabExist(/update/)).to.be.true;
      }
      await browser.closeWindow();
    });
  });
});
