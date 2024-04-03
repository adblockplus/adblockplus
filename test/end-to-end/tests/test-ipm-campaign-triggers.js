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
       waitForCondition} = require("../helpers");
const {expect} = require("chai");
const IPMChunk = require("../page-objects/ipm.chunk");
const ipmCampaignsData =
  require("../test-data/data-ipm-campaigns").ipmCampaignTriggersData;
let lastTest = false;

describe("test ABP IPM campaign triggers", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
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
      await browser.newWindow(dataSet.noTriggerStep);
      const ipmChunk = new IPMChunk(browser);
      expect(await ipmChunk.isIPMiFrameExisting()).to.be.false;
      await browser.closeWindow();
      await switchToABPOptionsTab();
      await browser.newWindow(dataSet.triggerStep1);
      if (!dataSet.testName.includes("new tab"))
      {
        try
        {
          await ipmChunk.switchToTab(dataSet.triggerStep1);
          await waitForCondition("isIPMiFrameExisting",
                                 10000, ipmChunk, true, 1000);
        }
        catch (Exception)
        {
          await switchToABPOptionsTab();
          await executeAsyncScript("chrome.runtime.sendMessage({type: " +
          "'testing.ping_ipm_server'});");
          await ipmChunk.switchToTab(dataSet.triggerStep1);
          await browser.refresh();
          await waitForCondition("isIPMiFrameExisting", 10000,
                                 ipmChunk, true, 1000);
        }
        await browser.pause(2000);
        await ipmChunk.init();
        expect(await ipmChunk.getIPMBodyText()).to.include(dataSet.ipmId);
        if (!dataSet.testName.includes("CTA clicked"))
        {
          await browser.closeWindow();
          await switchToABPOptionsTab();
        }
      }
      else
      {
        lastTest = true;
        await ipmChunk.switchToTab(/update/);
        expect(await doesTabExist(/update/)).to.be.true;
      }
      if (dataSet.testName.includes("CTA clicked"))
      {
        await ipmChunk.clickIPMCTAButton();
        await browser.closeWindow();
        await switchToABPOptionsTab();
      }
      await browser.newWindow(dataSet.triggerStep2);
      expect(await ipmChunk.isIPMiFrameExisting()).to.be.false;
      await browser.closeWindow();
      await switchToABPOptionsTab();
    });
  });
});
