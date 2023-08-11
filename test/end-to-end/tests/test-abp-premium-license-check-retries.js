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

const {beforeSequence} = require("../helpers");
const {expect} = require("chai");
const BackgroundPage = require("../page-objects/background.page");
const GeneralPage = require("../page-objects/general.page");
let globalOrigin;

describe("test abp premium license check retries", function()
{
  before(async function()
  {
    globalOrigin = await beforeSequence();
  });

  it("should retry the request 3 times in 1 minute intervals", async function()
  {
    await browser.newWindow("https://qa-mock-licensing-server.glitch.me/");
    const generalPage = new GeneralPage(browser);
    await generalPage.isMockLicensingServerTextDisplayed();
    await generalPage.switchToABPOptionsTab();
    await browser.executeScript(`
      Promise.all([
        new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({type: "prefs.set",
            key: "premium_license_check_url",
            value: "https://qa-mock-licensing-server.glitch.me/"},
            response => {
            if (browser.runtime.lastError) {
              reject(browser.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        }),
        new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({type: "premium.activate",
          userId: "valid_user_id"}, response => {
            if (browser.runtime.lastError) {
              reject(browser.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        })
      ]).then(results => console.log(results));
    `, []);
    let waitTime = 0;
    while (waitTime <= 150000)
    {
      await browser.refresh();
      if ((await generalPage.isPremiumButtonDisplayed()) == true)
      {
        break;
      }
      else
      {
        await browser.pause(200);
        waitTime += 200;
      }
    }
    if (waitTime >= 150000)
    {
      throw new Error("Premium was not enabled!");
    }
    expect(await generalPage.isPremiumButtonDisplayed()).to.be.true;
    const backgroundPage = new BackgroundPage(browser);
    if (browser.capabilities.browserName == "chrome")
    {
      await backgroundPage.init(globalOrigin);
      await backgroundPage.switchToABPOptionsTab();
    }
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
    expect(await generalPage.isPremiumButtonDisplayed()).to.be.true;
    await backgroundPage.switchToTab(/_generated_background_page/);
    let consoleLog;
    for (let i = 0; i < 4; i++)
    {
      consoleLog = await browser.getLogs("browser");
      try
      {
        expect(JSON.stringify(consoleLog)).to.match(new RegExp(
          "Premium license check failed \\(retries: " + i +
          "\\)[^a-z]*Error: Received error response \\(code: 500\\)"));
      }
      catch (Exception)
      {
        await browser.pause(3000);
        consoleLog = await browser.getLogs("browser");
        expect(JSON.stringify(consoleLog)).to.match(new RegExp(
          "Premium license check failed \\(retries: " + i +
          "\\)[^a-z]*Error: Received error response \\(code: 500\\)"));
      }
      if (i < 3)
      {
        // Wait 1 minute for a retry
        await browser.pause(63000);
      }
    }
  });
});
