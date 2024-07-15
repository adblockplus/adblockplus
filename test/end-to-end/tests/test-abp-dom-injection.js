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

const {beforeSequence, afterSequence, waitForNewWindow,
       executeAsyncScript} = require("../helpers");
const {expect} = require("chai");
const abpDomInjectionData =
  require("../test-data/data-abp-dom-injection").abpDomInjectionData;
let appVersion;
let id;

describe("test abp DOM injection", function()
{
  before(async function()
  {
    await beforeSequence();
    appVersion = await browser.
      executeScript("return browser.runtime.getManifest().version;", []);
    id = await executeAsyncScript("return browser.runtime." +
      "sendMessage({type: 'prefs.get', key: 'installation_id'});");
  });

  afterEach(async function()
  {
    await afterSequence();
  });

  abpDomInjectionData.forEach(async(dataSet) =>
  {
    it("should return correct values for: " + dataSet.testName, async function()
    {
      await waitForNewWindow(dataSet.url);
      let abpInfo;
      await browser.waitUntil(async() =>
      {
        try
        {
          abpInfo = JSON.parse(await browser.executeScript("return document." +
            "getElementById('__adblock-plus-extension-info').textContent;", [])
          );
          return true;
        }
        catch (e)
        {
          await browser.refresh();
        }
      }, {timeoutMsg: `abpInfo was not found on ${dataSet.url}`});
      const dataAbpInfo = JSON.parse(await browser.
        executeScript("return document.get" +
        'ElementsByTagName("html")[0].getAttribute' +
        '("data-adblock-plus-extension-info");', []));
      expect(abpInfo.isPremium == false).to.be.true;
      expect(abpInfo.premiumId == "").to.be.true;
      expect(abpInfo.version == appVersion).to.be.true;
      expect(abpInfo.id == id).to.be.true;
      expect(dataAbpInfo.isPremium == false).to.be.true;
      expect(dataAbpInfo.premiumId == "").to.be.true;
      expect(dataAbpInfo.version == appVersion).to.be.true;
      expect(dataAbpInfo.id == id).to.be.true;
      expect(dataAbpInfo.blockCount == 0).to.be.true;
      expect(dataAbpInfo.blockCount == abpInfo.blockCount).to.be.true;
      await browser.closeWindow();
    });
  });
});
