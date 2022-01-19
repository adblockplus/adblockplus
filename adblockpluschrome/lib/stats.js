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

import {EventEmitter} from "./events.js";
import {setBadge} from "./browserAction.js";
import {port} from "./messaging.js";
import {Prefs} from "./prefs.js";

const badgeColor = "#646464";
const badgeRefreshRate = 4;

let eventEmitter = new EventEmitter();
let blockedPerPage = new ext.PageMap();

/**
 * Gets the number of requests blocked on the given page.
 *
 * @param  {Page} page
 * @return {Number}
 */
export function getBlockedPerPage(page)
{
  return blockedPerPage.get(page) || 0;
}

let activeTabIds = new Set();
let activeTabIdByWindowId = new Map();

let badgeUpdateScheduled = false;

function updateBadge(tabId)
{
  if (!Prefs.show_statsinicon)
    return;

  for (let id of (typeof tabId == "undefined" ? activeTabIds : [tabId]))
  {
    let page = new ext.Page({id});
    let blockedCount = blockedPerPage.get(page);

    setBadge(page.id, blockedCount && {
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
    setTimeout(() => { badgeUpdateScheduled = false; updateBadge(); },
               1000 / badgeRefreshRate);
    badgeUpdateScheduled = true;
  }
}

// Once nagivation for the tab has been committed to (e.g. it's no longer
// being prerendered) we clear its badge, or if some requests were already
// blocked beforehand we display those on the badge now.
browser.webNavigation.onCommitted.addListener(details =>
{
  if (details.frameId == 0)
    updateBadge(details.tabId);
});

async function onBlockableItem({details, filter})
{
  if (!filter || filter.type != "blocking")
    return;

  let {tabId} = details;

  let page = new ext.Page({id: tabId});
  let blocked = blockedPerPage.get(page) || 0;
  ++blocked;

  blockedPerPage.set(page, blocked);
  scheduleBadgeUpdate(tabId);

  eventEmitter.emit("blocked_per_page", {tabId, blocked});

  // Don't update the total for incognito tabs.
  let tab = await browser.tabs.get(tabId);
  if (tab.incognito)
    return;

  // Make sure blocked_total is only read after the storage was loaded.
  await Prefs.untilLoaded;

  Prefs.blocked_total++;
  eventEmitter.emit("blocked_total", Prefs.blocked_total);
}

ewe.reporting.onBlockableItem.addListener(onBlockableItem);

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
      updateBadge(tab.id);
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
