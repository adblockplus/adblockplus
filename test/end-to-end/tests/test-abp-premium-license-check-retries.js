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

const {beforeSequence, enablePremiumByMockServer,
       switchToABPOptionsTab} = require("../helpers");
const {expect} = require("chai");
const PremiumHeaderChunk = require("../page-objects/premiumHeader.chunk");
const ServiceWorkerPage = require("../page-objects/serviceWorker.page");

describe("test abp premium license check retries", function()
{
  before(async function()
  {
    await beforeSequence();
  });

  it("should retry the request 3 times in 1 minute intervals", async function()
  {
    await enablePremiumByMockServer();
    const serviceWorkerPage = new ServiceWorkerPage(browser);
    await serviceWorkerPage.init();
    await switchToABPOptionsTab();
    await browser.executeScript(`
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "premium.activate",
        userId: "server_error_500" }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `, []);
    const premiumHeaderChunk = new PremiumHeaderChunk(browser);
    expect(await premiumHeaderChunk.isPremiumButtonDisplayed()).to.be.true;
    await browser.pause(2000);
    let logText;
    for (let i = 0; i < 4; i++)
    {
      await serviceWorkerPage.switchToTab(/serviceworker/);
      logText = await serviceWorkerPage.getLogTextAreaText();
      expect(JSON.stringify(logText)).to.match(new RegExp(
        "Premium license check failed \\(retries: " + i +
        "\\)[^a-z]*Error: Received error response \\(code: 500\\)"));
      if (i < 3)
      {
        await browser.refresh();
        await switchToABPOptionsTab();
        // Wait 1 minute for a retry
        await browser.pause(63000);
      }
    }
  });
});
