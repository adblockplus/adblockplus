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

require("dotenv").config({path: "../../.env.e2e"});
const fs = require("fs");
const path = require("path");

const GeneralPage = require("./page-objects/general.page");
const PremiumPage = require("./page-objects/premium.page");
const PremiumCheckoutPage = require("./page-objects/premiumCheckout.page");
const PremiumHeaderChunk = require("./page-objects/premiumHeader.chunk");

const globalRetriesNumber = 0;
const isGitlab = process.env.CI === "true";

const chromeCIBuild = findFirstMatchingFile(
  `../../${process.env.CHROME_BUILD}`);
const firefoxCIBuild = findFirstMatchingFile(
  `../../${process.env.FIREFOX_BUILD}`);

const extensionVersion = getExtensionVersion();
const distPath = path.join(process.cwd(), "..", "..", "dist");
const chromeExtensionPath =
  path.join(distPath, "release", `adblockpluschrome-${extensionVersion}.zip`);
const firefoxExtensionPath =
  path.join(distPath, "release", `adblockplusfirefox-${extensionVersion}.xpi`);
const helperExtensionPath =
  path.join(distPath, "devenv", "helper-extension.zip");

const testConfig = {
  allureEnabled: process.env.ENABLE_ALLURE === "true",
  browserName: process.env.BROWSER,
  screenshotsPath: path.join(process.cwd(), "screenshots")
};

async function afterSequence(optionsUrl = null)
{
  await switchToABPOptionsTab({optionsUrl, refresh: true});

  const generalPage = new GeneralPage(browser);
  await generalPage.init();

  await waitForAbleToExecuteScripts();
}

async function beforeSequence(expectInstalledTab = true)
{
  if (isFirefox())
  {
    await browser.installAddOn(getFirefoxExtension(), true);
    await browser.pause(500);
    await browser.installAddOn(getHelperExtension(), true);
  }

  const {origin, optionsUrl} = await waitForExtension();
  let installedUrl;
  if (expectInstalledTab)
  {
    // On MV3 the opening of the installed page may take a very long time
    // on slow environments
    const timeout = 50000;
    await browser.waitUntil(async() =>
    {
      for (const handle of await browser.getWindowHandles())
      {
        await browser.switchToWindow(handle);
        installedUrl = await browser.getUrl();
        if (/installed|first-run/.test(installedUrl))
        {
          await browser.url("about:blank"); // Ensures at least one open tab
          return true;
        }
      }
    }, {
      timeout,
      interval: 2000,
      timeoutMsg: `Installed page didn't open after ${timeout}ms`
    });
  }

  if (process.env.LOCAL_RUN !== "true")
    await browser.setWindowSize(1400, 1000);

  await afterSequence();

  return {origin, optionsUrl, installedUrl};
}

async function doesTabExist(tabName, timeout = 3000, countThreshold = 1)
{
  const startTime = new Date().getTime();
  let count = 0;
  const checkTab = async(tabIdentifier) =>
  {
    if (typeof tabIdentifier === "string")
    {
      const title = await browser.getTitle();
      const url = await browser.getUrl();
      return title === tabIdentifier || url === tabIdentifier;
    }
    else if (tabIdentifier instanceof RegExp)
    {
      const url = await browser.getUrl();
      return tabIdentifier.test(url);
    }
    return false;
  };
  while (new Date().getTime() - startTime < timeout)
  {
    const tabs = await browser.getWindowHandles();
    for (const tab of tabs)
    {
      await browser.switchToWindow(tab);
      if (await checkTab(tabName))
      {
        count++;
      }
    }
    if (count >= countThreshold)
    {
      return true;
    }
    await browser.pause(200);
  }
  return false;
}

async function enablePremiumByMockServer()
{
  await wakeMockServer("https://qa-mock-licensing-server.glitch.me/",
                       "Mock licensing server is up and running");
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
  const timeout = 15000;
  await browser.waitUntil(async() =>
  {
    try
    {
      await premiumHeaderChunk.premiumButton.waitForDisplayed();
      return true;
    }
    catch (e)
    {
      await browser.refresh();
    }
  }, {timeout, timeoutMsg: `Premium button not displayed after ${timeout}ms`});
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

  // Real premium takes a while to be enabled
  const timeout = 80000;
  await browser.waitUntil(async() =>
  {
    try
    {
      await premiumHeaderChunk.premiumButton.waitForDisplayed();
      return true;
    }
    catch (e)
    {
      await switchToABPOptionsTab({refresh: true});
    }
  }, {timeout, timeoutMsg: `Premium button not displayed after ${timeout}ms`});
}

async function executeAsyncScript(script, ...args)
{
  const [isError, value] = await browser.executeAsyncScript(`
    let promise = (async function() { ${script} }).apply(null, arguments[0]);
    let callback = arguments[arguments.length - 1];
    promise.then(
      res => callback([false, res]),
      err => callback([true, err instanceof Error ? err.message : err])
    );`, args);

  if (isError)
    throw new Error(value);
  return value;
}

async function getABPOptionsTabId()
{
  await switchToABPOptionsTab({switchToFrame: false});
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

function findFirstMatchingFile(pathWithPattern)
{
  const dir = path.dirname(pathWithPattern);
  const pattern = path.basename(pathWithPattern);
  const regexPattern = new RegExp(pattern.replace("*", ".*"));

  const files = fs.readdirSync(dir);
  const firstFile = files.find(file => regexPattern.test(file));

  if (firstFile)
  {
    return path.join(dir, firstFile);
  }
  throw new Error(`No file with pattern ${pattern} found in dir ${dir}`);
}

function getExtension(extensionPath)
{
  return fs.readFileSync(extensionPath).toString("base64");
}

function getChromiumExtension()
{
  return getExtension(isGitlab ? chromeCIBuild : chromeExtensionPath);
}

function getFirefoxExtension()
{
  return getExtension(isGitlab ? firefoxCIBuild : firefoxExtensionPath);
}

function getHelperExtension()
{
  return getExtension(helperExtensionPath);
}

function getCurrentDate(locale)
{
  return new Date().toLocaleDateString(locale);
}

function randomIntFromInterval(min, max)
{
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function switchToABPOptionsTab(options = {})
{
  const defaultOptions =
    {switchToFrame: true, optionsUrl: null, refresh: false};
  const {switchToFrame, optionsUrl, refresh} = {...defaultOptions, ...options};
  const timeout = 1000;

  const generalPage = new GeneralPage(browser);
  try
  {
    await generalPage.switchToTab("Adblock Plus Options", timeout);
  }
  catch (err)
  {
    // optionsUrl is passed when the options tab is expected to be closed
    if (!optionsUrl)
      throw err;

    // When the extension reloads WDIO seems to get confused about the current
    // tab, producing a "no such window" error on any browsing command.
    // Switching to the handle of any open tab as a workaround.
    await browser.switchToWindow((await browser.getWindowHandles())[0]);
    await browser.url(optionsUrl);
    await generalPage.switchToTab("Adblock Plus Options", 5000);
  }

  if (refresh)
    await browser.refresh();

  if (!switchToFrame)
    return;

  await browser.waitUntil(async() =>
  {
    if (await generalPage._generalTabButton.isClickable())
      return true; // already in the content frame

    try
    {
      await browser.switchToFrame(await $("#content"));
      return true;
    }
    catch (e) {}
  }, {
    timeout,
    timeoutMsg: `Could not switch to options content frame after ${timeout}ms`
  });
}

function waitForSwitchToABPOptionsTab(optionsUrl, timeout = 5000)
{
  return browser.waitUntil(async() =>
  {
    try
    {
      await switchToABPOptionsTab({optionsUrl});
      return true;
    }
    catch (e) {}
  }, {
    timeout,
    interval: 1000,
    timeoutMsg: `Could not switch to ABP Options Tab after ${timeout}ms`
  });
}

// Wait until the extension doesn't make webdriver throw when running scripts
// Only needed by firefox
async function waitForAbleToExecuteScripts(timeout = 15000)
{
  if (!isFirefox())
    return;

  return browser.waitUntil(async() =>
  {
    try
    {
      return await browser.executeScript("return true;", []);
    }
    catch (e) {}
  }, {
    timeout,
    interval: 2000,
    timeoutMsg: `Webdriver can't execute scripts after ${timeout}ms`
  });
}

// Under stress conditions, for some reason browser.newWindow() may silently
// fail. This is a workaround to ensure it either worked or timed out
async function waitForNewWindow(url, timeout = 5000)
{
  await browser.newWindow(url);
  return browser.waitUntil(async() =>
  {
    try
    {
      await browser.switchWindow(url);
      return true;
    }
    catch (e)
    {
      await browser.url(url);
    }
  }, {
    timeout,
    timeoutMsg: `Could not open new window "${url}" after ${timeout}ms`
  });
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
  const timeout = 20000;
  let origin;
  let optionsUrl;

  await waitForAbleToExecuteScripts();

  await browser.waitUntil(async() =>
  {
    for (const handle of await browser.getWindowHandles())
    {
      await browser.switchToWindow(handle);

      ({origin, optionsUrl} = await browser.executeAsync(async callback =>
      {
        if (typeof browser !== "undefined" &&
            browser.management !== "undefined")
        {
          const info = await browser.management.getSelf();
          callback(info.optionsUrl ?
            {origin: location.origin, optionsUrl: info.optionsUrl} : {});
        }
        else
        {
          callback({});
        }
      }));
      if (origin)
      {
        return true;
      }
    }
  }, {timeout, timeoutMsg: `Options page not found after ${timeout}ms`});

  return {origin, optionsUrl};
}

async function wakeMockServer(serverUrl, serverUpText)
{
  await browser.newWindow(serverUrl);
  const generalPage = new GeneralPage(browser);
  await generalPage.isMockServerUpTextDisplayed(serverUpText);
  await browser.closeWindow();
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
  await switchToABPOptionsTab({switchToFrame: false});

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

function localRunChecks()
{
  checkEnvFileExists();
  const {browserName} = testConfig;

  if (browserName === "chrome" || browserName === "edge")
    checkChromeReleaseBuild();
  else if (browserName === "firefox")
    checkFirefoxReleaseBuild();
}

function lambdatestRunChecks()
{
  if (isGitlab)
  {
    return;
  }

  checkEnvFileExists();

  if (!process.env.LT_USERNAME || !process.env.LT_ACCESS_KEY)
  {
    console.error("\x1b[33m%s\x1b[0m", `
-----------------------------------------------------------------
Please set the following environment variables in the .env.e2e file:
LT_USERNAME
LT_ACCESS_KEY
https://www.lambdatest.com/support/docs/using-environment-variables-for-authentication-credentials/
-----------------------------------------------------------------
    `);
    process.exit(1);
  }

  checkChromeReleaseBuild();
  checkFirefoxReleaseBuild();
}

function checkEnvFileExists()
{
  if (!fs.existsSync("../../.env.e2e"))
  {
    console.error("\x1b[33m%s\x1b[0m", `
-----------------------------------------------------------------
Please create a .env.e2e file in the root of the project.
You can use the .env.e2e.template file as a template.
-----------------------------------------------------------------
    `);
    process.exit(1);
  }
}

function checkChromeReleaseBuild()
{
  if (!fs.existsSync(chromeExtensionPath))
  {
    console.error("\x1b[33m%s\x1b[0m", `
-----------------------------------------------------------------
Could not find chrome extension in 'dist/release/*.zip'.
Run 'npm run build:release chrome' to build the MV2 extension.
Or 'npm run build:release chrome -- -m 3' to build the MV3 extension.
-----------------------------------------------------------------
    `);
    process.exit(1);
  }
}

function checkFirefoxReleaseBuild()
{
  if (!fs.existsSync(firefoxExtensionPath))
  {
    console.error("\x1b[33m%s\x1b[0m", `
-----------------------------------------------------------------
Could not find firefox extension in 'dist/release/*.xpi'.
Run 'npm run build:release firefox' to build it
-----------------------------------------------------------------
    `);
    process.exit(1);
  }
}

/**
 * The source of truth for the extension version is in base.mjs,
 * Which is an ES6 module.
 * Importing it would require us to make a lot of calls async or to port
 * the entire test suite to ES6.
 * To avoid that we just read the file and extract the version from it.
 * @returns {string} the extension version
 */
function getExtensionVersion()
{
  const baseManifestPath = "../../build/webext/config/base.mjs";
  const manifestContent = fs.readFileSync(baseManifestPath, "utf-8");
  const versionMatch = manifestContent.match(/version: "(.*?)"/);
  if (!versionMatch)
  {
    throw new Error("Could not find the version in the base manifest");
  }
  return versionMatch[1];
}

function isBrowser(browserName)
{
  return browser.capabilities.browserName.toLowerCase().includes(browserName);
}

function isChrome()
{
  return isBrowser("chrome");
}

function isFirefox()
{
  return isBrowser("firefox");
}

function isEdge()
{
  return isBrowser("edge");
}

module.exports = {
  afterSequence, beforeSequence, doesTabExist,
  executeAsyncScript, testConfig, localRunChecks,
  enablePremiumByMockServer, wakeMockServer, lambdatestRunChecks,
  getChromiumExtension, getFirefoxExtension, getHelperExtension,
  getCurrentDate, getTabId, enablePremiumByUI,
  randomIntFromInterval, globalRetriesNumber, switchToABPOptionsTab,
  waitForExtension, getABPOptionsTabId, waitForCondition,
  waitForSwitchToABPOptionsTab, waitForNewWindow, isChrome, isFirefox, isEdge
};
