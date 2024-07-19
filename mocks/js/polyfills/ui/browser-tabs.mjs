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

import {log} from "./logger.mjs";

let tabCounter = 0;
let activeTab = getTab(getTabURLFromQueryString());
const tabs = new Map([
  [activeTab.id, activeTab]
]);

function getTab(url)
{
  return {
    id: ++tabCounter,
    incognito: false,
    openerTabId: 1,
    url
  };
}

function getTabURLFromQueryString()
{
  if (window.top.location.search)
  {
    const params = window.top.location.search.substr(1).split("&");

    for (const param of params)
    {
      const parts = param.split("=", 2);
      if (parts.length == 2 && parts[0] === "pageURL")
      {
        return decodeURIComponent(parts[1]);
      }
    }
  }
  return "https://example.com";
}


export const captureVisibleTab = (tabId, options) =>
{
  log(`Take screenshot of tab with ID ${tabId || activeTab.id}`);
  return fetch("/mocks/data/image.base64.txt")
    .then(body => body.text());
};

export const create = (options) =>
{
  const tab = getTab(options.url);
  tabs.set(tab.id, tab);
  log(`Created tab '${tab.url}' with ID ${tab.id}`);

  if (options.active)
  {
    activeTab = tab;
    log(`Focused tab with ID ${activeTab.id}`);
  }

  return Promise.resolve(tab);
};

export const get = (tabId) =>
{
  const tab = tabs.get(tabId);
  if (!tab)
    return Promise.reject(new Error(`Tab with ID ${tabId} cannot be found`));

  return Promise.resolve(tab);
};

export const getCurrent = () => Promise.resolve(activeTab);

export const query = () => Promise.resolve(Array.from(tabs.values()));

export const onUpdated = {
  addListener() {}
};

export const reload = (tabId) =>
{
  log(`Reloaded tab: ${tabs.get(tabId).url}`);
  return Promise.resolve();
};

export const remove = (tabId) =>
{
  log(`Closed tab: ${tabs.get(tabId).url}`);
  tabs.delete(tabId);
  return Promise.resolve();
};

export const sendMessage = (tabId, msg) =>
{
  if (msg.type !== "composer.content.getState")
    return;

  return Promise.resolve({active: false});
};

export const update = (tabId, options) =>
{
  if (options.active)
  {
    activeTab = tabs.get(tabId);
    log(`Focused tab with ID ${activeTab.id}`);
  }
  return Promise.resolve();
};
