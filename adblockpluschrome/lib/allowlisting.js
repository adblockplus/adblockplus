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

import * as ewe from "@eyeo/webext-sdk";

import {port} from "./messaging/port.js";
import {EventEmitter} from "./events.js";
import {addFilter} from "./filterConfiguration.js";

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
port.on("filters.isAllowlisted", async message =>
{
  let pageAllowlisted = false;
  let hostnameAllowlisted = false;

  for (let filterText of await ewe.filters.getAllowingFilters(message.tab.id))
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
 * Allowlists the given domain or URL.
 *
 * @param {object} options
 *   Allowlisting options
 * @param {string} [options.hostname]
 *   Domain to allowlist (required unless singlePage is true)
 * @param {string} options.origin
 *   Filter origin
 * @param {boolean} [options.singlePage=false]
 *   Whether to allowlist the entire domain or a single page
 * @param {string} [options.url]
 *   URL to allowlist (required if no hostname)
 *
 * @returns {Promise}
 * @throws {Error} Either domain or valid URL required
 */
export async function allowlist({hostname, origin, singlePage = false, url})
{
  let filterText;

  if (!hostname && !url)
    throw new Error("Hostname or URL required");

  if (url)
  {
    if (!(url instanceof URL))
      throw new Error("Invalid URL");

    if (singlePage)
    {
      // We generate a filter which only applies to the same protocol and
      // subdomain, but one which doesn't consider the exact query string or
      // fragment.
      // Our logic here is taken from the legacy Firefox extension.
      // See https://hg.adblockplus.org/adblockplus/file/tip/lib/ui.js#l1517
      let ending = "|";
      url.hash = "";
      if (url.search && url.search.includes("&"))
      {
        url.search = "";
        ending = "?";
      }
      filterText = `@@|${url.href}${ending}$document`;
    }
    else
    {
      hostname = url.hostname;
    }
  }

  if (!filterText)
  {
    let host = hostname.replace(/^www\./, "");
    filterText = `@@||${host}^$document`;
  }

  await ewe.filters.enable([filterText]);

  const filterSubscriptions = await ewe.subscriptions.getForFilter(filterText);
  if (filterSubscriptions.length == 0)
    await addFilter(filterText, origin);
}

/**
 * Adds an allowing filter for the given page's hostname, if it is not
 * already allowlisted. Note: If a disabled allowing filter exists, we
 * enable that instead.
 *
 * @event "filters.allowlist"
 * @proper {string} [origin]
 *   String indicating where the filter originated from.
 * @property {boolean} [singlePage=false]
 *   If true we add an allowing filter for the given page's URL instead.
 * @property {object} tab
 *   Tab that contains the page to allowlist.
 */
port.on("filters.allowlist", async message =>
{
  let page = new ext.Page(message.tab);
  await allowlist({
    origin: message.origin,
    singlePage: message.singlePage,
    url: page.url
  });
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
  for (let filterText of await ewe.filters.getAllowingFilters(message.tab.id))
  {
    if (message.singlePage && allowlistedDomainRegexp.test(filterText))
      continue;

    await ewe.filters.remove([filterText]);

    const filterSubscriptions = await ewe.subscriptions
      .getForFilter(filterText);
    if (filterSubscriptions.length != 0)
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

async function revalidateAllowlistingState(page)
{
  const allowingFilters = await ewe.filters.getAllowingFilters(page.id);
  eventEmitter.emit("changed", page, allowingFilters.length > 0);
}

export async function revalidateAllowlistingStates()
{
  let tabs = await browser.tabs.query({});
  for (let tab of tabs)
    revalidateAllowlistingState(new ext.Page(tab));
}

ext.pages.onLoaded.addListener(revalidateAllowlistingState);
ewe.filters.onAdded.addListener(revalidateAllowlistingStates);
ewe.filters.onChanged.addListener(async(filter, property) =>
{
  if (property !== "enabled")
    return;

  await revalidateAllowlistingStates();
});
ewe.filters.onRemoved.addListener(revalidateAllowlistingStates);
ewe.subscriptions.onAdded.addListener(revalidateAllowlistingStates);
ewe.subscriptions.onChanged.addListener(async(subscription, property) =>
{
  if (property !== null && property !== "enabled")
    return;

  await revalidateAllowlistingStates();
});
ewe.subscriptions.onRemoved.addListener(revalidateAllowlistingStates);
