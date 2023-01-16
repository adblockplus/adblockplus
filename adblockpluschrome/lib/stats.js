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

/** @module stats */

import * as ewe from "../../vendor/webext-sdk/dist/ewe-api.js";
import {installHandler} from "./messaging/events.js";
import {port} from "./messaging/port.js";
import {TabSessionStorage} from "./storage/tab-session.js";
import {setBadge} from "./browserAction.js";
import {EventEmitter} from "./events.js";
import {Prefs} from "./prefs.js";
import * as scheduledEventEmitter from
  // eslint-disable-next-line max-len
  "../../src/core/scheduled-event-emitter/background/scheduled-event-emitter.ts";

const badgeColor = "#646464";
const badgeRefreshRate = 4;
const badgeUpdateTopic = "stats.badgeUpdate";

let eventEmitter = new EventEmitter();
let blockedPerPage = new TabSessionStorage("stats:blocked");

/**
 * Gets the number of requests blocked on the given page.
 *
 * @param  {Page} page
 * @return {Number}
 */
export async function getBlockedPerPage(page)
{
  return (await blockedPerPage.get(page.id)) || 0;
}

let activeTabIds = new Set();
let activeTabIdByWindowId = new Map();

let badgeUpdateScheduled = false;

async function updateBadge(tabId)
{
  if (!Prefs.show_statsinicon)
    return;

  for (let id of (typeof tabId == "undefined" ? activeTabIds : [tabId]))
  {
    let blockedCount = await blockedPerPage.get(id);

    setBadge(id, blockedCount && {
      color: badgeColor,
      number: blockedCount
    });
  }
}

function scheduleBadgeUpdate(tabId)
{
  if (!badgeUpdateScheduled && Prefs.show_statsinicon &&
      (typeof tabId == "undefined" || activeTabIds.has(tabId)))
  {
    scheduledEventEmitter.setSchedule(
      badgeUpdateTopic,
      1000 / badgeRefreshRate
    );
    badgeUpdateScheduled = true;
  }
}

scheduledEventEmitter.setListener(badgeUpdateTopic, async() =>
{
  badgeUpdateScheduled = false;
  await updateBadge();
});

// Once nagivation for the tab has been committed to (e.g. it's no longer
// being prerendered) we clear its badge, or if some requests were already
// blocked beforehand we display those on the badge now.
browser.webNavigation.onCommitted.addListener(async details =>
{
  if (details.frameId == 0)
    await updateBadge(details.tabId);
});

async function onBlockableItem({filter, request})
{
  if (!filter || filter.type != "blocking")
    return;

  let {tabId} = request;

  await blockedPerPage.transaction(async() =>
  {
    let blocked = await blockedPerPage.get(tabId) || 0;
    ++blocked;

    await blockedPerPage.set(tabId, blocked);
    scheduleBadgeUpdate(tabId);

    eventEmitter.emit("blocked_per_page", {tabId, blocked});
  });

  // Don't update the total for incognito tabs.
  let tab = await browser.tabs.get(tabId);
  if (tab.incognito)
    return;

  // Make sure blocked_total is only read after the storage was loaded.
  await Prefs.untilLoaded;

  Prefs.blocked_total++;
  eventEmitter.emit("blocked_total", Prefs.blocked_total);
}

/**
 * Checks request errors for requests blocked by client and, if appropriate,
 * calls the function to update the block counter.
 *
 * Note that we cannot distinguish whether the request was blocked by us or
 * another extension.
 *
 * This is only here as a temporary workaround until
 * ewe.reporting.onBlockableItem works properly in MV3.
 *
 * See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onErrorOccurred#details_2
 * for a type definition of the `details` object.
 *
 * @param {object} details The network error details
 */
async function handleRequestError({error, frameId, tabId, type, url})
{
  // Only check request errors inside of browser tabs, and only of
  // the `net::ERR_BLOCKED_BY_CLIENT` type.
  // NOTE: The error name "net::ERR_BLOCKED_BY_CLIENT" exists only in Chromium!
  if (
    tabId === browser.tabs.TAB_ID_NONE ||
    error !== "net::ERR_BLOCKED_BY_CLIENT"
  )
    return;

  // Ignore if request is allowlisted.
  const isAllowlisted = await ewe.filters.isResourceAllowlisted(
    url,
    ewe.reporting.contentTypesMap.get(type),
    tabId,
    frameId
  );
  if (isAllowlisted)
    return;

  // Call `onBlockableItem` and feed it data in a structure it can consume.
  void onBlockableItem({
    filter: {
      type: "blocking"
    },
    request: {
      tabId
    }
  });
}

// In the MV3 version, ewe.reporting.onBlockableItem doesn't yet report
// blocked items.
// Until ewe.reporting.onBlockableItem works correctly with MV3, we count
// every request that was blocked. However, we cannot distinguish whether the
// request was blocked by us or another extension.
if (browser.runtime.getManifest().manifest_version === 3)
{
  browser.webRequest.onErrorOccurred.addListener(
    handleRequestError,
    {urls: ["<all_urls>"]}
  );
}
else
{
  ewe.reporting.onBlockableItem.addListener(onBlockableItem);
}

/**
  * @namespace
  * @static
  */
export let Stats = {
  /**
   * Adds a callback that is called when the
   * value of a specified stat changed.
   *
   * @param {string}   stat
   * @param {function} callback
   */
  on(stat, callback)
  {
    eventEmitter.on(stat, callback);
  },

  /**
   * Removes a callback for the specified stat.
   *
   * @param {string}   stat
   * @param {function} callback
   */
  off(stat, callback)
  {
    eventEmitter.off(stat, callback);
  },

  /**
   * The total number of blocked requests on non-incognito pages.
   *
   * @type {number}
   */
  get blocked_total()
  {
    return Prefs.blocked_total;
  }
};

Prefs.on("show_statsinicon", async() =>
{
  let tabs = await browser.tabs.query({});
  for (let tab of tabs)
  {
    if (Prefs.show_statsinicon)
      await updateBadge(tab.id);
    else
      setBadge(tab.id, null);
  }
});

/**
 * Returns the number of blocked requests for the sender's page.
 *
 * @event "stats.getBlockedPerPage"
 * @returns {number}
 */
port.on("stats.getBlockedPerPage",
        message => getBlockedPerPage(new ext.Page(message.tab)));

/**
 * Returns the total number of blocked requests on non-incognito pages.
 *
 * @event "stats.getBlockedTotal"
 * @returns {number}
 */
port.on("stats.getBlockedTotal", () => Stats.blocked_total);

browser.tabs.query({active: true}).then(tabs =>
{
  for (let tab of tabs)
  {
    activeTabIds.add(tab.id);
    activeTabIdByWindowId.set(tab.windowId, tab.id);
  }

  scheduleBadgeUpdate();
});

installHandler("stats", null, (emit, action) =>
{
  const onChanged = info => emit(info);
  Stats.on(action, onChanged);
  return () => Stats.off(action, onChanged);
});

browser.tabs.onActivated.addListener(tab =>
{
  let lastActiveTabId = activeTabIdByWindowId.get(tab.windowId);
  if (typeof lastActiveTabId != "undefined")
    activeTabIds.delete(lastActiveTabId);

  activeTabIds.add(tab.tabId);
  activeTabIdByWindowId.set(tab.windowId, tab.tabId);

  scheduleBadgeUpdate();
});

if ("windows" in browser)
{
  browser.windows.onRemoved.addListener(windowId =>
  {
    activeTabIds.delete(activeTabIdByWindowId.get(windowId));
    activeTabIdByWindowId.delete(windowId);
  });
}
