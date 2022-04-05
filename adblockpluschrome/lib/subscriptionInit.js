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

/** @module subscriptionInit */

import * as ewe from "../../vendor/webext-sdk/dist/ewe-api.js";

import * as info from "info";
import {revalidateAllowlistingStates} from "./allowlisting.js";
import {initDisabledFilterCounters} from "./filterConfiguration.js";
import {port} from "./messaging.js";
import {initNotifications} from "./notificationHelper.js";
import {Prefs} from "./prefs.js";

let firstRun;
let userNotificationCallback = null;
let reinitialized = false;
let dataCorrupted = false;

/**
 * If there aren't any filters, the default subscriptions are added.
 * However, if patterns.ini already did exist and/or any preference
 * is set to a non-default value, this indicates that this isn't the
 * first run, but something went wrong.
 *
 * This function detects the first run, and makes sure that the user
 * gets notified (on the first run page) if the data appears incomplete
 * and therefore will be reinitialized.
 *
 * @param {boolean} foundSubscriptions
 * @param {boolean} foundStorage
 *
 * @return {Promise}
 */
async function detectFirstRun(foundSubscriptions, foundStorage)
{
  let userFilters = await ewe.filters.getUserFilters();
  firstRun = !foundSubscriptions && !userFilters.length;

  if (firstRun && (foundStorage || Prefs.currentVersion))
    reinitialized = true;

  Prefs.currentVersion = info.addonVersion;
}

/**
 * In case of data corruption, we don't want to show users
 * any non-essential notifications so we need to instruct
 * the notification manager to ignore them.
 *
 * @param {boolean} value
 */
function setDataCorrupted(value)
{
  dataCorrupted = value;
  ewe.notifications.ignored = value;
}

function addSubscriptionsAndNotifyUser()
{
  for (let url of Prefs.additional_subscriptions)
  {
    try
    {
      ewe.subscriptions.add(url);
      ewe.subscriptions.sync(url);
    }
    catch (ex)
    {
      console.error(`Failed to add additional subscription: ${url}`);
    }
  }

  if (userNotificationCallback)
    userNotificationCallback({dataCorrupted, firstRun, reinitialized});
}

/**
 * We need to check whether we can safely write to/read from storage
 * before we start relying on it for storing preferences.
 */
async function testStorage()
{
  let testKey = "readwrite_test";
  let testValue = Math.random();

  try
  {
    await browser.storage.local.set({[testKey]: testValue});
    let result = await browser.storage.local.get(testKey);
    if (result[testKey] != testValue)
      throw new Error("Storage test: Failed to read and write value");
  }
  finally
  {
    await browser.storage.local.remove(testKey);
  }
}

function initElementHidingDebugMode()
{
  Prefs.on("elemhide_debug", () =>
  {
    ewe.debugging.setElementHidingDebugMode(Prefs.elemhide_debug);
  });

  ewe.debugging.setElementHidingDebugMode(Prefs.elemhide_debug);
  ewe.debugging.setElementHidingDebugStyle(
    [
      ["background", "#e67370"],
      ["outline", "solid #f00"]
    ],
    [
      ["background", `
        repeating-linear-gradient(
          to bottom,
          #e67370 0,
          #e67370 9px,
          #fff 9px,
          #fff 10px
        )
      `],
      ["outline", "solid #f00"]
    ]
  );
}

(async() =>
{
  const [eweFirstRun] = await Promise.all([
    ewe.start({
      name: info.addonName,
      version: info.addonVersion
    }),
    Prefs.untilLoaded.catch(() => { setDataCorrupted(true); }),
    testStorage().catch(() => { setDataCorrupted(true); })
  ]);

  await detectFirstRun(
    eweFirstRun.foundSubscriptions,
    eweFirstRun.foundStorage
  );
  addSubscriptionsAndNotifyUser();
  revalidateAllowlistingStates();

  // We have to require the "uninstall" module on demand,
  // as the "uninstall" module in turn requires this module.
  (await import("./uninstall.js")).setUninstallURL();

  initDisabledFilterCounters();
  initElementHidingDebugMode();
  initNotifications(firstRun);
})();

/**
 * Gets a value indicating whether a data corruption was detected.
 *
 * @return {boolean}
 */
export function isDataCorrupted()
{
  return dataCorrupted;
}

/**
 * Sets a callback that is called with environment information after
 * initialization to notify users.
 *
 * @param {function} callback
 */
export function setNotifyUserCallback(callback)
{
  userNotificationCallback = callback;
}

/**
 * @typedef {object} subscriptionsGetInitIssuesResult
 * @property {boolean} dataCorrupted
 *   true if it appears that the user's extension data was corrupted.
 * @property {boolean} reinitialized
 *   true if we have reset the user's settings due to data corruption.
 */

/**
 * Returns an Object with boolean flags for any subscription initialization
 * issues.
 *
 * @event "subscriptions.getInitIssues"
 * @returns {subscriptionsGetInitIssuesResult}
 */
port.on("subscriptions.getInitIssues",
        (message, sender) => ({dataCorrupted, reinitialized}));
