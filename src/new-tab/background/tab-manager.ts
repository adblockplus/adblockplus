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

import * as browser from "webextension-polyfill";
import {
  CommandName,
  createSafeOriginUrl,
  dismissCommand,
  doesLicenseStateMatch,
  getBehavior,
  recordEvent
} from "../../ipm/background";
import * as logger from "../../logger/background";
import {
  NewTabEventType,
  NewTabExitEventType,
  NewTabErrorEventType,
  isNewTabBehavior,
  setNewTabCommandHandler
} from "./middleware";
import {
  ListenerType,
  type ListenerSet,
  type Listener
} from "./tab-manager.types";

/**
 * Maps IPM IDs to the listeners that have been attached by them.
 */
const listenerMap = new Map<string, ListenerSet>();

/**
 * A collection of ids of tabs that have been opened since we
 * started listening.
 */
const tabIds = new Set<number>();

/**
 * A map of functions that handle update events on tabs that we have created
 * ourselves. Keys are the IPM IDs that triggered the tab creation.
 */
const newTabUpdateListeners = new Map<string, Listener>();

/**
 * Listens to updates on the tab we created ourselves to check if the
 * contents have been loaded. We do this to send an event back to the
 * IPM server.
 *
 * @param ipmId - The ipmId of the command that lead to attachment of this listener
 * @param tabId - The id of the tab updated
 * @param changeInfo - Lists the changes to the state of the tab that is updated
 * @param tab - The tab updated
 */
function onNewTabUpdated(
  ipmId: string,
  tabId: number,
  changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
  tab: browser.Tabs.Tab
): void {
  if (changeInfo.status !== "complete" || tab === null || tabId !== tab.id) {
    return;
  }

  void recordEvent(ipmId, CommandName.createTab, NewTabEventType.loaded);

  const listener = newTabUpdateListeners.get(ipmId);
  if (typeof listener === "undefined") {
    return;
  }
  newTabUpdateListeners.delete(ipmId);
  browser.tabs.onUpdated.removeListener(listener);
}

/**
 * Opens a new tab to the URL specified on the IPM command
 *
 * @param ipmId - IPM ID
 */
async function openNewTab(ipmId: string): Promise<void> {
  logger.debug("[new-tab]: openNewTab");

  removeListeners(ipmId);
  listenerMap.delete(ipmId);
  tabIds.clear();

  // Ignore and dismiss command if it has invalid behavior.
  const behavior = getBehavior(ipmId);
  if (!isNewTabBehavior(behavior)) {
    logger.debug("[new-tab]: Invalid command behavior.");
    void recordEvent(
      ipmId,
      CommandName.createTab,
      NewTabErrorEventType.noBehaviorFound
    );
    dismissCommand(ipmId);
    return;
  }

  // Ignore and dismiss command if license states mismatch.
  if (!(await doesLicenseStateMatch(behavior))) {
    logger.debug("[new-tab]: License state mismatch.");
    void recordEvent(
      ipmId,
      CommandName.createTab,
      NewTabErrorEventType.licenseStateNoMatch
    );
    dismissCommand(ipmId);
    return;
  }

  // Ignore and dismiss command if given target URL doesn't meet safe
  // origin requirements.
  const targetUrl = createSafeOriginUrl(behavior.target);
  if (targetUrl === null) {
    logger.debug("[new-tab]: Invalid target URL.");
    void recordEvent(
      ipmId,
      CommandName.createTab,
      NewTabErrorEventType.noUrlFound
    );
    dismissCommand(ipmId);
    return;
  }

  // Add update listener to see when our tab is done loading.
  const updateListener = onNewTabUpdated.bind(null, ipmId);
  newTabUpdateListeners.set(ipmId, updateListener);
  browser.tabs.onUpdated.addListener(updateListener);

  const tab = await browser.tabs.create({ url: targetUrl }).catch((error) => {
    logger.error("[new-tab]: create tab error", error);
    return null;
  });

  if (tab === null) {
    // There was an error during tab creation. Let's retry later.
    void recordEvent(
      ipmId,
      CommandName.createTab,
      NewTabErrorEventType.tabCreationError
    );
    return;
  }

  void recordEvent(ipmId, CommandName.createTab, NewTabEventType.created);
  dismissCommand(ipmId);
}

/**
 * Listens to the creation of tabs and will add their ids to our list.
 *
 * On Firefox, will directly open the new tab.
 *
 * @param ipmId - The ipmId of the command that lead to attachment of this listener.
 * @param tab - The tab created
 */
function onTabCreated(ipmId: string, tab: browser.Tabs.Tab): void {
  // Firefox loads its New Tab Page immediately and doesn't notify us
  // when it's complete so we need to open our new tab already here.
  if (tab.url === "about:newtab") {
    void openNewTab(ipmId);
    return;
  }

  if (typeof tab.id !== "number") {
    return;
  }

  tabIds.add(tab.id);
}

/**
 * Listens to update events on tabs and checks the updated tab to see if it
 * signals that we can open our own new tab now.
 *
 * @param ipmId - The ipmId of the command that lead to attachment of this listener.
 * @param tabId - The id of the tab updated
 * @param changeInfo - Lists the changes to the state of the tab that is updated
 * @param tab - The tab updated
 */
function onTabUpdated(
  ipmId: string,
  tabId: number,
  changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
  tab: browser.Tabs.Tab
): void {
  // Only look at tabs that have been opened since we started listening
  // and that have completed loading.
  if (!tabIds.has(tabId) || changeInfo.status !== "complete") {
    return;
  }

  tabIds.delete(tabId);

  // If we don't have a URL, we cannot run checks on it.
  if (typeof tab.url !== "string") {
    return;
  }

  // Open our own new tab only when a new tab gets opened
  // that isn't part of the user browsing the web.
  if (/^https?:/.test(tab.url)) {
    return;
  }

  void openNewTab(ipmId);
}

/**
 * Listens to the removal of tabs, and will remove their ids from our list.
 *
 * @param tabId - The id of the tab removed
 */
function onTabRemoved(tabId: number): void {
  tabIds.delete(tabId);
}

/**
 * Creates listeners for the given ipmId.
 *
 * @param ipmId - The ipmId to create the listeners for
 * @returns A set of three listeners
 */
function createListeners(ipmId: string): ListenerSet {
  return {
    [ListenerType.create]: onTabCreated.bind(null, ipmId),
    [ListenerType.update]: onTabUpdated.bind(null, ipmId),
    [ListenerType.remove]: onTabRemoved.bind(null)
  };
}

/**
 * Removes listeners for the given ipmId.
 *
 * @param ipmId - The ipmId to remove the listeners for
 */
function removeListeners(ipmId: string): void {
  const listeners = listenerMap.get(ipmId);
  if (typeof listeners === "undefined") {
    return;
  }

  browser.tabs.onCreated.removeListener(listeners[ListenerType.create]);
  browser.tabs.onUpdated.removeListener(listeners[ListenerType.update]);
  browser.tabs.onRemoved.removeListener(listeners[ListenerType.remove]);
}

/**
 * Handles new tab command
 *
 * @param ipmId - IPM ID
 */
async function handleCommand(ipmId: string): Promise<void> {
  logger.debug("[new-tab]: tab manager handleCommand", ipmId);

  // Don't open new tabs if we're in an automation scenario.
  if (navigator.webdriver) {
    return;
  }

  // Don't open new tabs if we're on a managed installation.
  const { installType } = await browser.management.getSelf();
  if ((installType as unknown) === "admin") {
    void recordEvent(ipmId, CommandName.createTab, NewTabExitEventType.admin);
    dismissCommand(ipmId);
    return;
  }

  // Add listeners
  const listeners = createListeners(ipmId);
  listenerMap.set(ipmId, listeners);

  browser.tabs.onCreated.addListener(listeners[ListenerType.create]);
  browser.tabs.onUpdated.addListener(listeners[ListenerType.update]);
  browser.tabs.onRemoved.addListener(listeners[ListenerType.remove]);
}

/**
 * Initializes new tab manager
 */
async function start(): Promise<void> {
  logger.debug("[new-tab]: tab manager start");
  setNewTabCommandHandler(handleCommand);
}

void start().catch(logger.error);
