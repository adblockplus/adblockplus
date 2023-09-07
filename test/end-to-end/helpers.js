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

const chromeBuild = "../../" + process.env.CHROME_BUILD;
const firefoxBuild = "../../" + process.env.FIREFOX_BUILD;
// ======== USE THE FOLLOWING FOR DEBUGGING PURPOSES ==========
// const chromeBuild = "../../adblockpluschrome/adblockpluschrome-3.16.zip";
// const firefoxBuild = "../../adblockpluschrome/adblockplusfirefox-3.16.xpi";
const ciTesting = process.env.CI_TESTING || true;

const fs = require("fs");
const BasePage = require("./page-objects/base.page");
const ExtensionsPage = require("./page-objects/extensions.page");
const GeneralPage = require("./page-objects/general.page");
const PremiumHeaderChunk = require("./page-objects/premiumHeader.chunk");
const helperExtension = "helper-extension";
const globalRetriesNumber = 2;

async function afterSequence()
{
  const extensionsPage = new ExtensionsPage(browser);
  try
  {
    await extensionsPage.switchToABPOptionsTab();
    const generalPage = new GeneralPage(browser);
    await generalPage.init();
  }
  catch (Exception)
  {
    try
    {
      if (browser.capabilities.browserName == "firefox")
      {
        await extensionsPage.switchToTab("Debugging - Runtime / this-firefox");
      }
      else
      {
        await extensionsPage.switchToTab("Extensions");
      }
    }
    // eslint-disable-next-line no-catch-shadow
    catch (SecondException)
    {
      try
      {
        await extensionsPage.init();
        await extensionsPage.clickReloadHelperExtensionButton();
        await extensionsPage.switchToABPOptionsTab();
      }
      catch (ThirddException) {}
    }
  }
}

async function beforeSequence()
{
  if (browser.capabilities.browserName == "firefox")
  {
    const abpXpiFileName = getFirefoxExtensionPath();
    const abpExtensionXpi = await fs.promises.readFile(abpXpiFileName);
    const helperExtensionZip = await fs.promises.
      readFile("helper-extension/helper-extension.zip");
    await browser.installAddOn(abpExtensionXpi.toString("base64"), true);
    await browser.pause(500);
    await browser.installAddOn(helperExtensionZip.toString("base64"), true);
  }
  const [origin] = await waitForExtension();
  await browser.waitUntil(async() =>
  {
    return (await browser.getWindowHandles()).length == 3;
  }, {timeout: 10000});
  await browser.url(`${origin}/desktop-options.html`);
  await browser.setWindowSize(1400, 1000);
  return [origin];
}

async function enablePremiumByMockServer()
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
  const premiumHeaderChunk = new PremiumHeaderChunk(browser);
  let waitTime = 0;
  while (waitTime <= 150000)
  {
    await browser.refresh();
    if ((await premiumHeaderChunk.isPremiumButtonDisplayed()) == true)
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
}

function getChromiumExtensionPath()
{
  let chromeExtension;
  if (ciTesting)
  {
    chromeExtension = require("fs").
      readFileSync(chromeBuild).toString("base64");
  }
  else
  {
    const extensionPath = "../../dist/devenv/chrome";
    chromeExtension = extensionPath;
  }
  return chromeExtension;
}

function getCurrentDate(locale)
{
  return new Date().toLocaleDateString(locale);
}

function getFirefoxExtensionPath()
{
  let abpXpiFileName;
  if (ciTesting)
  {
    abpXpiFileName = firefoxBuild;
  }
  else
  {
    const files = fs.readdirSync("../../dist/release");
    files.forEach(async(name) =>
    {
      if (/.*\.xpi/.test(name))
      {
        abpXpiFileName = "../../dist/release/" + name;
      }
    });
  }
  return abpXpiFileName;
}

function randomIntFromInterval(min, max)
{
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function waitForExtension()
{
  let origin;
  const basePage = new BasePage(browser);
  await basePage.switchToTab("Adblock Plus Options");
  await browser.waitUntil(async() =>
  {
    for (const handle of await browser.getWindowHandles())
    {
      await browser.switchToWindow(handle);
      origin = await browser.executeAsyncScript(`
        let callback = arguments[arguments.length - 1];
        (async() =>
        {
          if (typeof browser != "undefined")
          {
            let info = await browser.management.getSelf();
            if (info.optionsUrl)
            {
              callback(location.origin);
              return;
            }
          }
          callback(null);
        })();`, []);
      if (origin)
        return true;
    }
    return false;
  }, {timeout: 5000}, "options page not found");

  return [origin];
}

module.exports = {afterSequence, beforeSequence, enablePremiumByMockServer,
                  getChromiumExtensionPath,
                  getCurrentDate, getFirefoxExtensionPath,
                  randomIntFromInterval, helperExtension,
                  globalRetriesNumber, waitForExtension};
