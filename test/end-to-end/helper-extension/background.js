/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2020-present eyeo GmbH
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

let extensionUrl;

function openOptionsPage()
{
  chrome.management.getAll(extensions =>
  {
    for (const extension of extensions)
    {
      if (
        extension.type == "extension" &&
        extension.installType == "development" &&
        extension.id != chrome.runtime.id &&
        extension.name != "Chrome Automation Extension"
      )
      {
        extensionUrl = extension.optionsUrl;
        chrome.tabs.create({url: extension.optionsUrl});
      }
    }
  });
}

function openDevToolsPanelPage()
{
  const devToolsPanelUrl = extensionUrl.match(/.*\//)[0] + "devtools-panel.html";
  chrome.tabs.create({url: devToolsPanelUrl});
}

chrome.webNavigation.onCompleted.addListener(details =>
{
  if (
    details.url === "https://adblockplus.org/openDevToolsPanelPage" &&
    details.tabId
  )
  {
    openDevToolsPanelPage();
  }
}, {url: [{hostEquals: "adblockplus.org"}]});

function openServiceWorkerPage()
{
  chrome.tabs.update({url: "chrome://serviceworker-internals/"});
}

chrome.webNavigation.onCompleted.addListener(details =>
{
  if (
    details.url === "https://adblockplus.org/openServiceWorkerPage" &&
    details.tabId
  )
  {
    openServiceWorkerPage();
  }
}, {url: [{hostEquals: "adblockplus.org"}]});

openOptionsPage();

const closeLoadedDataTabInterval = setInterval(() =>
{
  chrome.tabs.query({}, tabs =>
  {
    for (const tab of tabs)
    {
      if (tab.url.startsWith("data"))
      {
        chrome.tabs.remove(tab.id);
        clearInterval(closeLodingTabInterval);
        clearInterval(closeLoadedDataTabInterval);
      }
    }
  });
}, 2000);

const closeLodingTabInterval = setTimeout(() =>
{
  chrome.tabs.query({}, tabs =>
  {
    for (const tab of tabs)
    {
      if (tab.status === "loading" && !tab.url.endsWith("options.html"))
      {
        chrome.tabs.remove(tab.id);
        clearInterval(closeLodingTabInterval);
        clearInterval(closeLoadedDataTabInterval);
      }
    }
  });
}, 3000);
