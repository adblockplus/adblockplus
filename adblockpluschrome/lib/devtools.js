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

/** @module devtools */

import * as info from "info";

import * as ewe from "../../vendor/webext-sdk/dist/ewe-api.js";
import {installHandler} from "./messaging/events.js";
import {port} from "./messaging/port.js";
import {
  toPlainBlockableItem,
  toPlainFilter,
  toPlainSubscription
} from "./messaging/types.js";
import {TabSessionStorage} from "./storage/tab-session.js";
import {compareVersions} from "./versions.js";

const reloadStateByPage = new TabSessionStorage("devtools:reloadState");

async function onBlockableItem(emit, blockableItem)
{
  const {filter} = blockableItem;

  let subscriptions = [];
  if (filter)
  {
    subscriptions = await ewe.subscriptions.getForFilter(filter.text);
    subscriptions = subscriptions
      .filter(subscription => subscription.enabled)
      .map(toPlainSubscription);
  }

  emit(
    toPlainBlockableItem(blockableItem),
    (filter) ? toPlainFilter(filter) : null,
    subscriptions
  );
}

function onPageFrame(emit, details)
{
  void reloadStateByPage.transaction(async() =>
  {
    const {tabId} = details;
    const reloadState = await reloadStateByPage.get(tabId);

    // Clear the devtools panel and reload the inspected tab without caching
    // when a new request is issued. However, make sure that we don't end up
    // in an infinite recursion if we already triggered a reload.
    if (reloadState === "reloading")
    {
      await reloadStateByPage.delete(tabId);
      return;
    }

    emit("requests", "reset");

    // We can't repeat the request if it isn't a GET request. The browser would
    // prompt the user to confirm reloading the page, and POST requests are
    // known to cause issues on many websites if repeated.
    if (details.method === "GET")
      await reloadStateByPage.set(tabId, "needsReload");
  });
}

function onPageLoad(page)
{
  void reloadStateByPage.transaction(async() =>
  {
    const reloadState = await reloadStateByPage.get(page.id);

    // Reloading the tab is the only way that allows bypassing all caches, in
    // order to see all requests in the devtools panel. Reloading must not be
    // performed before the tab changes to "loading", otherwise it will load the
    // previous URL.
    if (reloadState === "needsReload")
    {
      await reloadStateByPage.set(page.id, "reloading");
      browser.tabs.reload(page.id, {bypassCache: true});
    }
  });
}

/**
 * Returns true if our devtools panel is supported by the browser.
 *
 * @event "devtools.supported"
 * @returns {boolean}
 */
port.on("devtools.supported", (message, sender) =>
  info.platform == "chromium" ||
  info.application == "firefox" &&
  compareVersions(info.applicationVersion, "54") >= 0
);

installHandler("requests", null, (emit, action, targetTabId) =>
{
  switch (action)
  {
    case "hits":
      const blockableItemsOptions = {
        filterType: "all",
        includeElementHiding: true,
        includeUnmatched: true,
        tabId: targetTabId
      };
      const localOnBlockableItem = onBlockableItem.bind(null, emit);

      ewe.reporting.onBlockableItem.addListener(
        localOnBlockableItem,
        blockableItemsOptions
      );
      return () =>
      {
        ewe.reporting.onBlockableItem.removeListener(
          localOnBlockableItem,
          blockableItemsOptions
        );
      };
    case "reset":
      const localOnPageFrame = onPageFrame.bind(null, emit);
      const localOnPageLoad = onPageLoad.bind(null, emit);

      browser.webRequest.onBeforeRequest.addListener(
        localOnPageFrame,
        {
          urls: ["http://*/*", "https://*/*"],
          types: ["main_frame"],
          tabId: targetTabId
        }
      );
      ext.pages.onLoading.addListener(localOnPageLoad);

      return () =>
      {
        browser.webRequest.onBeforeRequest.removeListener(localOnPageFrame);
        ext.pages.onLoading.removeListener(localOnPageLoad);
      };
  }
});
