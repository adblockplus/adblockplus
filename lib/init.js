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

const info = require("info");
const {Prefs} = require("prefs");
const {setNotifyUserCallback} = require("subscriptionInit");

const {
  showProblemNotification,
  showUpdatesNotification
} = require("./notifications");
const {updatesVersion} = require("./prefs");

const localFirstRunPageUrl = browser.runtime.getURL("first-run.html");
const urlPlaceholders = new Set([
  ["LANG", () => browser.i18n.getUILanguage().replace("-", "_")],
  ["ADDON_NAME", () => info.addonName],
  ["ADDON_VERSION", () => info.addonVersion],
  ["APPLICATION_NAME", () => info.application],
  ["APPLICATION_VERSION", () => info.applicationVersion],
  ["PLATFORM_NAME", () => info.platform],
  ["PLATFORM_VERSION", () => info.platformVersion]
]);

function listenForRemotePage(checkIsFirstRunTab)
{
  let stop = () => {};

  const promise = new Promise((resolve, reject) =>
  {
    let timeout = null;

    function removeListeners()
    {
      clearTimeout(timeout);
      browser.webNavigation.onDOMContentLoaded.removeListener(
        onNavigationCompleted
      );
      browser.webNavigation.onErrorOccurred.removeListener(onErrorOccurred);
      browser.webRequest.onCompleted.removeListener(onRequestCompleted);
    }
    stop = removeListeners;

    function onErrorOccurred(details)
    {
      if (!checkIsFirstRunTab(details.tabId))
        return;

      console.warn(`Failed to open first-run page: ${details.error}`);
      removeListeners();
      reject();
    }
    browser.webNavigation.onErrorOccurred.addListener(onErrorOccurred);

    function onNavigationCompleted(details)
    {
      if (!checkIsFirstRunTab(details.tabId))
        return;

      removeListeners();
      resolve();
    }
    browser.webNavigation.onDOMContentLoaded.addListener(onNavigationCompleted);

    function onRequestCompleted(details)
    {
      if (!checkIsFirstRunTab(details.tabId))
        return;

      const {statusCode} = details;
      if (statusCode < 200 || statusCode > 399)
      {
        console.warn(`Failed to open first-run page: HTTP ${statusCode}`);
        removeListeners();
        reject();
      }
    }
    browser.webRequest.onCompleted.addListener(
      onRequestCompleted,
      {
        types: ["main_frame"],
        urls: ["https://*/*"]
      }
    );

    function onTimeout()
    {
      console.warn("Failed to open first-run page: Timed out");
      removeListeners();
      reject();
    }
    timeout = setTimeout(onTimeout, 3000);
  });

  return {promise, stop};
}

async function wait(time)
{
  return new Promise((resolve) =>
  {
    setTimeout(resolve, time);
  });
}

async function updateTab(tabId, url)
{
  // Chrome doesn't reliably update the tab and fails silently so we need to
  // retry repeatedly and check whether it worked.
  for (let i = 0; i < 10; i++)
  {
    await browser.tabs.update(tabId, {url});
    await wait(250);

    const tab = await browser.tabs.get(tabId);
    if (tab.url === url)
      return;
  }

  throw new Error("Failed to update tab");
}

async function openFirstRunPage(shouldShowWarning = false, forceLocal = false)
{
  const showLocal = shouldShowWarning || forceLocal;

  let firstRunTabId = null;
  let waitForRemotePage = Promise.resolve();
  let url = localFirstRunPageUrl;

  if (!showLocal)
  {
    waitForRemotePage = listenForRemotePage((tabId) => tabId === firstRunTabId);
    url = Prefs.remote_first_run_page_url;
    for (const [key, getValue] of urlPlaceholders)
    {
      const value = (typeof getValue === "function") ? getValue() : null;
      url = url.replace(`%${key}%`, encodeURIComponent(value));
    }
  }

  try
  {
    // Users with corrupted browser data may see this page each time their
    // browser starts. We avoid focusing the page for those users, in the
    // hope to make the situation less intrusive.
    const tab = await browser.tabs.create({
      active: !shouldShowWarning,
      url
    });
    firstRunTabId = tab.id;

    try
    {
      await waitForRemotePage.promise;
    }
    catch (ex)
    {
      waitForRemotePage.stop();

      // If remote page fails to load, replace it with local page
      await updateTab(firstRunTabId, localFirstRunPageUrl);
    }
  }
  catch (ex)
  {
    waitForRemotePage.stop();

    // Open local page if we failed to open remote page or replace tab,
    // unless we've already tried
    if (!showLocal)
      openFirstRunPage(shouldShowWarning, true);
  }
}

async function onNotifyUser(state)
{
  const {firstRun, reinitialized} = state;
  let {dataCorrupted} = state;

  // Show first run page, update notification or problem notification.
  // The update notification is only shown if the user hasn't been notified
  // of the latest major update yet.
  if (firstRun || updatesVersion > Prefs.last_updates_page_displayed ||
    dataCorrupted || reinitialized)
  {
    try
    {
      await Prefs.set("last_updates_page_displayed", updatesVersion);
    }
    catch (ex)
    {
      dataCorrupted = true;
    }

    const canShowNotification = info.application !== "fennec";
    const shouldShowWarning = dataCorrupted || reinitialized;

    // Show a notification if a data corruption was detected (either through
    // failure of reading from or writing to storage.local).
    if (shouldShowWarning && canShowNotification)
    {
      showProblemNotification();
      return;
    }

    if (!Prefs.suppress_first_run_page)
    {
      // Always show the first run page if a data corruption was detected
      // but we cannot show a notification. The first run page notifies the
      // user about the data corruption.
      if (firstRun || shouldShowWarning)
      {
        const locale = browser.i18n.getUILanguage();
        openFirstRunPage(
          shouldShowWarning,
          // Force local page for certain languages
          /^de\b/.test(locale)
        );
        return;
      }

      // Show a notification to inform the user about the latest major update.
      showUpdatesNotification();
    }
  }
}
setNotifyUserCallback(onNotifyUser);
