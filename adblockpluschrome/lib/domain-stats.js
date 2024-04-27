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

/** @module website_stats */

import * as ewe from "@eyeo/webext-ad-filtering-solution";
import {TabSessionStorage} from "./storage/tab-session.js";
import {EventEmitter} from "./events.js";
import {Prefs} from "./prefs.js";

let eventEmitter = new EventEmitter();

// Even in MV2 we need to save it to survive the browser/webext restarts,
// thus using local storage. not session storage.
let blockedPerDomain = new TabSessionStorage("stats:blocked_per_domain", true);

// Map <domain: numeric domain id>
const trackedDomains = {
  "facebook.com": FACEBOOK_ID
};

// Warning: the numbers must be unique and never changing as they
// are storage in user devices local storages!
export const FACEBOOK_ID = -1;

export function start()
{
  ewe.reporting.onBlockableItem.addListener(onBlockableItem);
}

function extractCountry(request)
{
  // TODO
  return "(country)";
}

function extractPlatform()
{
  // TODO
  return "(platform)";
}

function isTrackedDomain(domain)
{
  // TODO: extract and check subdomains
  return Object.keys(trackedDomains).includes(domain);
}

async function onBlockableItem({filter, request})
{
  if (!filter || filter.type != "blocking")
    return;

  const {hostname} = new URL(request.url);
  if (!isTrackedDomain(hostname))
    return;

  let {tabId} = request;

  // TabSessionStorage is designed to map for a numeric keys,
  // so we use hardcoded domain ids per domain
  const domainId = trackedDomains[hostname];

  await blockedPerDomain.transaction(async() =>
  {
    const entry =
    {
      // Saving domain is a bit excessive as we have domainId
      // used as a key, so we can save `domain.length` bytes for every entry
      // in the storage. TODO: discuss whether we need it
      domain: hostname,

      timestamp: request.timeStamp,
      country: extractCountry(request),
      platform: extractPlatform()
    };
    await blockedPerDomain.append(domainId, entry);

    eventEmitter.emit("blocked_per_domain", {hostname, entry});
  });

  // Don't update the total for incognito tabs.
  let tab = await browser.tabs.get(tabId);
  if (tab.incognito)
    return;

  // Make sure blocked_total is only read after the storage was loaded.
  await Prefs.untilLoaded;

  // TODO: update total facebook.com (EE-417)
}

/**
 * Return the list of saved blocked entries
 * @param {number} domainId Domain id or `null`/`undefined` for all the domains
 * @returns {Promise}
 */
export async function getEntries(domainId)
{
  const domainIds = domainId ? [domainId] : Object.values(trackedDomains);
  let result = [];
  for (const eachDomainId of domainIds)
  {
    const entries = await blockedPerDomain.get(eachDomainId);
    if (entries && entries.length > 0)
      result.push(entries);
  }

  return result;
}

/**
 * Deletes all the saved enties for the domain
 * @param {number} domainId Domain id or `null`/`undefined` for all the domains
 * @returns {Promise}
 */
export async function deleteEntries(domainId)
{
  await blockedPerDomain.delete(domainId);
}
