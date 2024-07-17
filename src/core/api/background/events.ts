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

import type Browser from "webextension-polyfill";

import { EventEmitter } from "../../../../adblockpluschrome/lib/events";
import {
  type CleanupFunction,
  type EventHandler,
  type EventHandlerInstall
} from "./events.types";
import { isListenMessage } from "../shared";
import { isTrustedSender } from "./port";

/**
 * Cleanup functions by tab ID
 */
const cleanupByTabId = new Map<number, CleanupFunction>();
/**
 * Event emitter
 */
const eventEmitter = new EventEmitter();
/**
 * Map of event handlers by event name
 */
const handlerByName = new Map<string, EventHandler>();

/**
 * Map of event handler templates by event type
 */
const handlerTemplateByType = new Map<string, EventHandler>();

/**
 * Installs a handler for lazily adding/removing event listeners depending on
 * whether someone is actively listening via the Messaging API.
 *
 * @param type
 *   type of events to allow listening to
 * @param action
 *   specific event to allow listening to
 *   null if handler applies to all events for the given type
 * @param install
 *   callback function for adding event listeners
 *   will receive emit, action, targetTabId as arguments
 *   expected to return callback function for removing event listeners
 */
export function installHandler(
  type: string,
  action: string | null,
  install: EventHandlerInstall
): void {
  const handler: EventHandler = { install, uninstall: null };

  // Handlers that can be used for arbitrary actions should be used as
  // templates, from which we can create handlers later
  if (action === null) {
    handlerTemplateByType.set(type, handler);
    return;
  }

  handlerByName.set(`${type}.${action}`, handler);
}

/**
 * Activates event handler for given type of events
 *
 * @param type - Event type
 * @param actions - Event names
 * @param uiPort - UI page port
 * @param targetTabId - ID of tab for which to listen to events
 */
function listen(
  type: string,
  actions: string[],
  uiPort: Browser.Runtime.Port,
  targetTabId: number | null = null
): void {
  const cleanups: CleanupFunction[] = [];

  for (const action of actions) {
    let name = `${type}.${action}`;
    if (targetTabId !== null) {
      name = `${name}:${targetTabId}`;
    }

    // Add message response listener
    const onResponse = (...args: unknown[]): void => {
      uiPort.postMessage({ type: `${type}.respond`, action, args });
    };
    eventEmitter.on(name, onResponse);

    // Install event handler
    let handler = handlerByName.get(name);
    // If there's no handler for the given action, we should check
    // whether there's a generic handler for the type and create one from that
    if (typeof handler === "undefined") {
      const template = handlerTemplateByType.get(type);
      if (typeof template !== "undefined") {
        handler = Object.assign({}, template);
        handlerByName.set(name, handler);
      }
    }
    if (typeof handler !== "undefined" && handler.uninstall === null) {
      const emit = eventEmitter.emit.bind(eventEmitter, name);
      handler.uninstall = handler.install(emit, action, targetTabId);
    }

    cleanups.push(() => {
      eventEmitter.off(name, onResponse);

      // Uninstall event handler, if it's no longer needed
      if (!eventEmitter.hasListeners(name)) {
        const actionHandler = handlerByName.get(name);
        if (
          typeof actionHandler !== "undefined" &&
          typeof actionHandler.uninstall === "function"
        ) {
          actionHandler.uninstall();
          if (typeof handler !== "undefined") {
            handler.uninstall = null;
          }
        }
      }
    });
  }

  const cleanupAll = (): void => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };

  // Stop listening when port disconnects (e.g. page is closed),
  // or when target tab is closed
  uiPort.onDisconnect.addListener(cleanupAll);
  if (targetTabId !== null) {
    cleanupByTabId.set(targetTabId, cleanupAll);
  }
}

/**
 * Handles tab removed events
 *
 * @param tabId - Tab ID
 */
function onTabRemoved(tabId: number): void {
  const cleanup = cleanupByTabId.get(tabId);
  if (typeof cleanup === "undefined") {
    return;
  }

  cleanup();
  cleanupByTabId.delete(tabId);
}

/**
 * Handles connection events
 *
 * @param uiPort - UI page port
 */
function onConnect(uiPort: Browser.Runtime.Port): void {
  if (!uiPort.sender || !isTrustedSender(uiPort.sender)) {
    return;
  }

  if (uiPort.name !== "ui") {
    return;
  }

  uiPort.onMessage.addListener((message: unknown) => {
    if (!isListenMessage(message)) {
      return;
    }

    const [type, action] = message.type.split(".", 2);

    // For now we're only using long-lived connections
    // for handling "*.listen" messages
    // https://issues.adblockplus.org/ticket/6440/
    if (action !== "listen") {
      return;
    }

    listen(type, message.filter, uiPort, message.tabId);
  });
}

/**
 * Initializes messaging event handling functionality
 */
function start(): void {
  browser.tabs.onRemoved.addListener(onTabRemoved);
  browser.runtime.onConnect.addListener(onConnect);
}

start();
