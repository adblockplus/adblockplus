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
// const chromeBuild = "../../dist/release/adblockpluschrome-3.19.zip";
// const firefoxBuild = "../../dist/release/adblockplusfirefox-3.19.xpi";
const ciTesting = process.env.CI_TESTING || true;

const fs = require("fs");
const ExtensionsPage = require("./page-objects/extensions.page");
const GeneralPage = require("./page-objects/general.page");
const PremiumPage = require("./page-objects/premium.page");
const PremiumCheckoutPage = require("./page-objects/premiumCheckout.page");
const PremiumHeaderChunk = require("./page-objects/premiumHeader.chunk");
const helperExtension = "helper-extension";
const globalRetriesNumber = 2;

async function afterSequence()
{
  const extensionsPage = new ExtensionsPage(browser);
  try
  {
    await switchToABPOptionsTab();
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
        await switchToABPOptionsTab();
      }
      catch (ThirdException)
      {
      }
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
    return ((await browser.getWindowHandles()).length >= 3);
  }, {timeout: 10000});
  await browser.url(`${origin}/desktop-options.html`);
  await browser.setWindowSize(1400, 1000);
  await browser.switchWindow("Adblock Plus Options");
  return [origin];
}

async function enablePremiumByMockServer()
{
  await browser.newWindow("https://qa-mock-licensing-server.glitch.me/");
  const generalPage = new GeneralPage(browser);
  await generalPage.isMockLicensingServerTextDisplayed();
  await browser.closeWindow();
  await switchToABPOptionsTab();
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
    return false;
  }
}

async function enablePremiumByUI()
{
  const premiumHeaderChunk = new PremiumHeaderChunk(browser);
  await premiumHeaderChunk.clickUpgradeButton();
  await premiumHeaderChunk.
    switchToTab(/accounts.adblockplus.org\/en\/premium/);
  let currentUrl = await premiumHeaderChunk.getCurrentUrl();
  if (!currentUrl.includes("accounts"))
  {
    await premiumHeaderChunk.
      switchToTab(/accounts.adblockplus.org\/en\/premium/);
    await browser.pause(1000);
    currentUrl = await premiumHeaderChunk.getCurrentUrl();
  }
  await browser.url(currentUrl + "&testmode");
  const premiumPage = new PremiumPage(browser);
  await premiumPage.clickGetPremiumMonthlyButton();
  await premiumPage.clickPremiumCheckoutButton();
  const premiumCheckoutPage = new PremiumCheckoutPage(browser);
  await premiumCheckoutPage.init();
  await premiumCheckoutPage.typeTextToEmailField("test_automation" +
    randomIntFromInterval(1000000, 9999999).toString() + "@adblock.org");
  await premiumCheckoutPage.typeTextToZIPField("10001");
  await premiumCheckoutPage.clickContinueButton();
  await premiumCheckoutPage.typeTextToCardNumberField("4242424242424242");
  await premiumCheckoutPage.typeTextToCardExpiryField("0528");
  await premiumCheckoutPage.typeTextToCardCvcField("295");
  await premiumCheckoutPage.typeTextToNameOnCardField("Test Automation");
  await premiumCheckoutPage.clickSubscribeButton();
  await browser.switchToFrame(null);
  await switchToABPOptionsTab(true);
  await waitForCondition("isPremiumButtonDisplayed",
                         premiumHeaderChunk);
}

async function getABPOptionsTabId()
{
  await switchToABPOptionsTab(true);
  const currentTab = await browser.executeAsyncScript(`
    function getTabID()
    {
      return new Promise((resolve, reject) =>
      {
        try
        {
          chrome.tabs.query({active: true,}, function (tabs)
          {
            resolve(tabs[0].id);})} catch (e) {reject(e);
          }
        })
      }
      async function returnID()
      {
        let responseTabID = await getTabID();
        return responseTabID;}
        var callback = arguments[arguments.length - 1];
        returnID().then((data)=> {callback(data)
      });`, []);
  return currentTab;
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

async function switchToABPOptionsTab(noSwitchToFrame = false)
{
  const extensionsPage = new ExtensionsPage(browser);
  try
  {
    await extensionsPage.switchToTab("Adblock Plus Options");
  }
  catch (Exception)
  {
    await extensionsPage.init();
    if (browser.capabilities.browserName == "firefox")
    {
      await extensionsPage.switchToTab("Debugging - Runtime / this-firefox");
    }
    else
    {
      await extensionsPage.switchToTab("Extensions");
    }
    await extensionsPage.clickReloadHelperExtensionButton();
    await extensionsPage.switchToTab("Adblock Plus Options");
  }
  if (noSwitchToFrame === false)
  {
    try
    {
      await browser.switchToFrame(await $("#content"));
    }
    catch (Exception)
    {
    }
  }
}

async function waitForCondition(condition, object = null, waitTime = 150000,
                                refresh = true, pauseTime = 200, text = null)
{
  let waitTimeMS = 0;
  let conditionResult = false;
  while (waitTimeMS <= waitTime)
  {
    if (refresh)
    {
      await browser.refresh();
    }
    if (object !== null)
    {
      if (text !== null)
      {
        conditionResult = (await object[condition]()).includes(text);
      }
      else
      {
        conditionResult = await object[condition]();
      }
    }
    else
    {
      conditionResult = await condition;
    }
    if (conditionResult == true)
    {
      break;
    }
    else
    {
      await browser.pause(pauseTime);
      waitTimeMS += pauseTime;
    }
  }
  if (waitTimeMS >= waitTime)
  {
    throw new Error("Condition was not met within the waitTime!");
  }
}

async function waitForExtension()
{
  let origin;
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
      {
        return true;
      }
    }
    return false;
  }, {timeout: 15000}, "options page not found");

  return [origin];
}

/**
 * Gets the ID of current tab using the browser.tabs WebExtension API.
 * This is mainly used to work with the popup when it is open in a tab.
 * ⚠️ Make sure the tab you are targeting is loaded before trying to retrieve
 * its ID
 * @param {object} options
 * @param {string} options.title - The title of the tab
 * @param {string} options.urlPattern - A url [match pattern string](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns)
 * @returns {Number} `browser.tabs.TAB_ID_NONE` when tab was not found,
 * or the tab ID from the browser.tabs Web extension API.
 */
async function getTabId({title, urlPattern})
{
  const currentWindowHandle = await browser.getWindowHandle();
  await switchToABPOptionsTab(true);

  const queryOptions = {};
  if (title)
  {
    queryOptions.title = title;
  }
  if (urlPattern)
  {
    queryOptions.url = urlPattern;
  }

  const tabId = await browser.executeAsync(async(params, done) =>
  {
    try
    {
      const tabs = await browser.tabs.query(params.queryOptions);
      if (tabs.length)
      {
        done(tabs[0].id);
        return;
      }
    }
    catch (error)
    {
      console.error(error);
    }

    done(browser.tabs.TAB_ID_NONE);
  }, {queryOptions});

  await browser.switchToWindow(currentWindowHandle);

  return tabId;
}

module.exports = {afterSequence, beforeSequence, enablePremiumByMockServer,
                  getChromiumExtensionPath, enablePremiumByUI,
                  getCurrentDate, getFirefoxExtensionPath, getTabId,
                  randomIntFromInterval, helperExtension,
                  globalRetriesNumber, switchToABPOptionsTab,
                  waitForExtension, getABPOptionsTabId, waitForCondition};
