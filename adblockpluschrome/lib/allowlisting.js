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

/** @module allowlisting */

import * as ewe from "../../vendor/webext-sdk/dist/ewe-api.js";
import {EventEmitter} from "./events.js";
import {port} from "./messaging.js";

let allowlistedDomainRegexp = /^@@\|\|([^/:]+)\^\$document$/;
let eventEmitter = new EventEmitter();

/**
 * @typedef {object} filtersIsAllowlistedResult
 * @property {boolean} hostname
 *   True if an allowing filter for an entire domain matches the given page.
 * @property {boolean} page
 *   True if an allowing filter _not_ for an entire domain matches the given
 *   page.
 */

/**
 * Checks if the given page is allowlisted.
 *
 * @event "filters.isAllowlisted"
 * @returns {filtersIsAllowlistedResult}
 */
port.on("filters.isAllowlisted", message =>
{
  let pageAllowlisted = false;
  let hostnameAllowlisted = false;

  for (let filterText of ewe.filters.getAllowingFilters(message.tab.id))
  {
    if (allowlistedDomainRegexp.test(filterText))
      hostnameAllowlisted = true;
    else
      pageAllowlisted = true;

    if (pageAllowlisted && hostnameAllowlisted)
      break;
  }

  return {hostname: hostnameAllowlisted, page: pageAllowlisted};
});

/**
 * Adds an allowing filter for the given page's hostname, if it is not
 * already allowlisted. Note: If a disabled allowing filter exists, we
 * enable that instead.
 *
 * @event "filters.allowlist"
 * @property {boolean} [singlePage=false]
 *   If true we add an allowing filter for the given page's URL instead.
 */
port.on("filters.allowlist", async message =>
{
  let page = new ext.Page(message.tab);
  let filterText;
  if (!message.singlePage)
  {
    let host = page.url.hostname.replace(/^www\./, "");
    filterText = `@@||${host}^$document`;
  }
  else
  {
    // We generate a filter which only applies to the same protocol (e.g. http)
    // and subdomain, but one which doesn't consider the exact query string or
    // fragment.
    // Our logic here is taken from the legacy Firefox extension.
    // See https://hg.adblockplus.org/adblockplus/file/tip/lib/ui.js#l1517
    let ending = "|";
    page.url.hash = "";
    if (page.url.search && page.url.search.includes("&"))
    {
      page.url.search = "";
      ending = "?";
    }
    filterText = `@@|${page.url.href}${ending}$document`;
  }

  await ewe.filters.enable([filterText]);
  if (ewe.subscriptions.getForFilter(filterText).length == 0)
    await ewe.filters.add([filterText]);
});

/**
 * Remove any allowing filters which apply to the given page's URL.
 *
 * @event "filters.unallowlist"
 * @property {boolean} [singlePage=false]
 *   If true we only remove allowing filters which are not for an entire
 *   domain.
 */
port.on("filters.unallowlist", async message =>
{
  for (let filterText of ewe.filters.getAllowingFilters(message.tab.id))
  {
    if (message.singlePage && allowlistedDomainRegexp.test(filterText))
      continue;

    await ewe.filters.remove([filterText]);
    if (ewe.subscriptions.getForFilter(filterText).length != 0)
      await ewe.filters.disable([filterText]);
  }
});

/**
 * @namespace
 * @static
 */
export let allowlistingState = {
  /**
   * Adds a listener for the given event name.
   *
   * @param {string} name
   * @param {function} listener
   */
  addListener: eventEmitter.on.bind(eventEmitter),

  /**
   * Removes a listener for the given event name.
   *
   * @param {string} name
   * @param {function} listener
   */
  removeListener: eventEmitter.off.bind(eventEmitter)
};

function revalidateAllowlistingState(page)
{
  eventEmitter.emit(
    "changed",
    page,
    ewe.filters.isResourceAllowlisted(page.url, "document", page.id)
  );
}

export async function revalidateAllowlistingStates()
{
  let tabs = await browser.tabs.query({});
  for (let tab of tabs)
    revalidateAllowlistingState(new ext.Page(tab));
}

ext.pages.onLoading.addListener(revalidateAllowlistingState);
ewe.filters.onAdded.addListener(revalidateAllowlistingStates);
ewe.filters.onChanged.addListener((filter, property) =>
{
  if (property !== "enabled")
    return;

  revalidateAllowlistingStates();
});
ewe.filters.onRemoved.addListener(revalidateAllowlistingStates);
ewe.subscriptions.onAdded.addListener(revalidateAllowlistingStates);
ewe.subscriptions.onChanged.addListener((subscription, property) =>
{
  if (property !== null && property !== "enabled")
    return;

  revalidateAllowlistingStates();
});
ewe.subscriptions.onRemoved.addListener(revalidateAllowlistingStates);
