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

import { type Tabs } from "webextension-polyfill";

import { EventEmitter } from "../../../../adblockpluschrome/lib/events";
import { type TabDescriptor, type TabPage } from "./pages.types";

export const pageEmitter = new EventEmitter();

/**
 * Retrieves information about page shown in tab
 * @deprecated use browser.Tabs.Tab objects instead
 *
 * @param tab - Information relating to a tab
 * @returns information about page shown in tab
 */
export async function getPage(tab: TabDescriptor): Promise<TabPage | null> {
  if (typeof tab.id !== "number") {
    return null;
  }

  // Usually our Page objects are created from Chrome's Tab objects, which
  // provide the URL. But sometimes we only have the tab ID.
  let url = tab.url;
  // But sometimes we only have the tab id when we create a Page object.
  // In that case we get the url from top frame of the tab, recorded by
  // the onBeforeRequest handler.
  if (!url) {
    const frames = await browser.webNavigation.getAllFrames({ tabId: tab.id });
    for (const frame of frames) {
      if (frame.frameId !== 0) {
        continue;
      }

      url = frame.url;
    }
  }

  if (!url) {
    url = "about:blank";
  }

  return {
    id: tab.id,
    url: new URL(url)
  };
}

// We have to update the frame structure for documents that weren't
// loaded over HTTP (including documents cached by Service Workers),
// when the navigation occurs. However, we must be careful to not
// update the state of the same document twice, otherewise the number
// of any ads blocked already and any recorded sitekey could get lost.
/**
 * Handles browser.webNavigation.onCommitted events
 *
 * @param tabId - Tab ID
 * @param frameId - Frame ID
 * @param url - Navigation URL
 */
async function handleNavigationCommitted(
  tabId: number,
  frameId: number,
  url: string
): Promise<void> {
  if (frameId !== 0) {
    return;
  }

  try {
    await browser.tabs.get(tabId);
  } catch (ex) {
    // If the tab is prerendered, browser.tabs.get() sets
    // browser.runtime.lastError and we have to dispatch the onLoading
    // event, since the onUpdated event isn't dispatched for prerendered
    // tabs. However, we have to keep relying on the onUpdated event for
    // tabs that are already visible. Otherwise browser action changes get
    // overridden when Chrome automatically resets them on navigation.
    const page = await getPage({ id: tabId, url });
    pageEmitter.emit("loading", page);
  }
}

/**
 * Handles browser.tabs.onActivated event
 *
 * @param tabId - Tab ID
 */
async function handleTabActivated(tabId: number): Promise<void> {
  const page = await getPage({ id: tabId });
  pageEmitter.emit("activated", page);
}

/**
 * Handles browser.tabs.onUpdated event
 *
 * @param changeInfo - Tab update information
 * @param tab - Updated tab
 */
async function handleTabUpdated(
  changeInfo: Tabs.OnUpdatedChangeInfoType,
  tab: Tabs.Tab
): Promise<void> {
  if (changeInfo.status === "loading") {
    const page = await getPage(tab);
    pageEmitter.emit("loading", page);
  } else if (changeInfo.status === "complete") {
    const page = await getPage(tab);
    pageEmitter.emit("loaded", page);
  }
}

/**
 * Initializes page management functionality
 */
export function start(): void {
  browser.tabs.onActivated.addListener((details) => {
    void handleTabActivated(details.tabId);
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    pageEmitter.emit("removed", tabId);
  });

  browser.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    pageEmitter.emit("removed", removedTabId);
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    void handleTabUpdated(changeInfo, tab);
  });

  browser.webNavigation.onCommitted.addListener((details) => {
    void handleNavigationCommitted(details.tabId, details.frameId, details.url);
  });
}
