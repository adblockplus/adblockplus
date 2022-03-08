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

import * as ewe from "../../vendor/webext-sdk/dist/ewe-api.js";
import {port} from "./messaging.js";
import {getTarget} from "./hitLogger.js";
import * as info from "info";
import {compareVersions} from "./versions.js";

let panels = new Map();

function getFilterInfo(filter)
{
  if (!filter)
    return null;

  let userDefined = false;
  let subscriptionTitle = null;

  for (let subscription of ewe.subscriptions.getForFilter(filter.text))
  {
    if (!subscription.enabled)
      continue;

    if (subscription.downloadable)
      subscriptionTitle = subscription.title;
    else
      userDefined = true;
  }

  return {
    text: filter.text,
    allowlisted: filter.type == "allowing" ||
      filter.type == "elemhideexception",
    userDefined,
    subscription: subscriptionTitle
  };
}

function hasRecord(newRecord, oldRecord)
{
  if (oldRecord.target.url !== newRecord.target.url)
    return false;

  if (oldRecord.target.docDomain !== newRecord.target.docDomain)
    return false;

  // Ignore frame content allowlisting if there is already
  // a DOCUMENT exception which disables all means of blocking.
  if (oldRecord.target.type == "DOCUMENT")
  {
    if (!newRecord.target.isFrame)
      return false;
  }
  else if (oldRecord.target.type !== newRecord.target.type)
  {
    return false;
  }

  // Matched element hiding filters don't relate to a particular request,
  // so we have to compare the selector in order to avoid duplicates.
  if (oldRecord.filter && newRecord.filter)
  {
    if (oldRecord.filter.selector != newRecord.filter.selector)
      return false;
  }

  // We apply multiple CSP filters to a document, but we must still remove
  // any duplicates. Two CSP filters are duplicates if both have identical
  // text.
  if (oldRecord.filter && oldRecord.filter.csp &&
      newRecord.filter && newRecord.filter.csp)
  {
    if (oldRecord.filter.text !== newRecord.filter.text)
      return false;
  }

  return true;
}

function addRecord(panel, filterMatch)
{
  let matchesAny = false;
  let {filter} = filterMatch;
  let target = getTarget(filterMatch);
  let newRecord = {filter, target};

  for (let i = 0; i < panel.records.length; i++)
  {
    let oldRecord = panel.records[i];

    let matches = hasRecord(newRecord, oldRecord);
    if (!matches)
      continue;

    matchesAny = true;

    // Update record without filters, if filter matches on later checks
    if (!filter)
      break;

    if (oldRecord.filter)
      continue;

    oldRecord.filter = filter;

    panel.port.postMessage({
      type: "update-record",
      index: i,
      request: oldRecord.target,
      filter: getFilterInfo(oldRecord.filter)
    });
  }

  if (matchesAny)
    return;

  panel.port.postMessage({
    type: "add-record",
    request: target,
    filter: getFilterInfo(filter)
  });

  panel.records.push(newRecord);
}

function onBeforeRequest(details)
{
  let panel = panels.get(details.tabId);

  // Clear the devtools panel and reload the inspected tab without caching
  // when a new request is issued. However, make sure that we don't end up
  // in an infinite recursion if we already triggered a reload.
  if (panel.reloading)
  {
    panel.reloading = false;
  }
  else
  {
    panel.records = [];
    panel.port.postMessage({type: "reset"});

    // We can't repeat the request if it isn't a GET request. Chrome would
    // prompt the user to confirm reloading the page, and POST requests are
    // known to cause issues on many websites if repeated.
    if (details.method == "GET")
      panel.reload = true;
  }
}

function onLoading(page)
{
  let tabId = page.id;
  let panel = panels.get(tabId);

  // Reloading the tab is the only way that allows bypassing all caches, in
  // order to see all requests in the devtools panel. Reloading must not be
  // performed before the tab changes to "loading", otherwise it will load the
  // previous URL.
  if (panel && panel.reload)
  {
    browser.tabs.reload(tabId, {bypassCache: true});

    panel.reload = false;
    panel.reloading = true;
  }
}

browser.runtime.onConnect.addListener(newPort =>
{
  let match = newPort.name.match(/^devtools-(\d+)$/);
  if (!match)
    return;

  let inspectedTabId = parseInt(match[1], 10);
  let localOnBeforeRequest = onBeforeRequest.bind();
  let panel = {port: newPort, records: []};
  let onBlockableItem = addRecord.bind(null, panel);

  browser.webRequest.onBeforeRequest.addListener(
    localOnBeforeRequest,
    {
      urls: ["http://*/*", "https://*/*"],
      types: ["main_frame"],
      tabId: inspectedTabId
    }
  );

  if (panels.size == 0)
    ext.pages.onLoading.addListener(onLoading);

  let options = {
    filterType: "all",
    includeElementHiding: true,
    includeUnmatched: true,
    tabId: inspectedTabId
  };

  newPort.onDisconnect.addListener(() =>
  {
    ewe.reporting.onBlockableItem.removeListener(onBlockableItem, options);
    panels.delete(inspectedTabId);
    browser.webRequest.onBeforeRequest.removeListener(localOnBeforeRequest);

    if (panels.size == 0)
      ext.pages.onLoading.removeListener(onLoading);
  });

  ewe.reporting.onBlockableItem.addListener(onBlockableItem, options);
  panels.set(inspectedTabId, panel);
});

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
