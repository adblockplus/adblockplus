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

import {EventEmitter} from "../events.js";

const cleanupByTabId = new Map();
const eventEmitter = new EventEmitter();
const handlerByName = new Map();
const handlerTemplateByType = new Map();

/**
 * Installs a handler for lazily adding/removing event listeners depending on
 * whether someone is actively listening via the Messaging API.
 *
 * @param {string} type
 *   type of events to allow listening to
 * @param {string} [action]
 *   specific event to allow listening to
 *   null if handler applies to all events for the given type
 * @param {Function} install
 *   callback function for adding event listeners
 *   will receive emit, action, targetTabId as arguments
 *   expected to return callback function for removing event listeners
 */
export function installHandler(type, action, install)
{
  const handler = {install, uninstall: null};

  // Handlers that can be used for arbitrary actions should be used as
  // templates, from which we can create handlers later
  if (!action)
  {
    handlerTemplateByType.set(type, handler);
    return;
  }

  handlerByName.set(`${type}.${action}`, handler);
}

function listen(type, actions, uiPort, targetTabId = null)
{
  const cleanups = [];

  for (const action of actions)
  {
    let name = `${type}.${action}`;
    if (targetTabId !== null)
      name = `${name}:${targetTabId}`;

    // Add message response listener
    const onResponse = (...args) =>
    {
      uiPort.postMessage({type: `${type}.respond`, action, args});
    };
    eventEmitter.on(name, onResponse);

    // Install event handler
    let handler = handlerByName.get(name);
    // If there's no handler for the given action, we should check
    // whether there's a generic handler for the type and create one from that
    if (!handler)
    {
      const template = handlerTemplateByType.get(type);
      if (template)
      {
        handler = Object.assign({}, template);
        handlerByName.set(name, handler);
      }
    }
    if (handler && !handler.uninstall)
    {
      const emit = eventEmitter.emit.bind(eventEmitter, name);
      handler.uninstall = handler.install(emit, action, targetTabId);
    }

    cleanups.push(() =>
    {
      eventEmitter.off(name, onResponse);

      // Uninstall event handler, if it's no longer needed
      if (!eventEmitter.hasListeners(name))
      {
        const actionHandler = handlerByName.get(name);
        if (actionHandler && actionHandler.uninstall)
        {
          actionHandler.uninstall();
          handler.uninstall = null;
        }
      }
    });
  }

  const cleanupAll = () =>
  {
    for (const cleanup of cleanups)
      cleanup();
  };

  // Stop listening when port disconnects (e.g. page is closed),
  // or when target tab is closed
  uiPort.onDisconnect.addListener(cleanupAll);
  if (targetTabId !== null)
    cleanupByTabId.set(targetTabId, cleanupAll);
}

function onTabRemoved(tabId)
{
  const cleanup = cleanupByTabId.get(tabId);
  if (!cleanup)
    return;

  cleanup();
  cleanupByTabId.delete(tabId);
}
browser.tabs.onRemoved.addListener(onTabRemoved);

function onConnect(uiPort)
{
  if (!ext.isTrustedSender(uiPort.sender))
    return;

  if (uiPort.name !== "ui")
    return;

  uiPort.onMessage.addListener(message =>
  {
    const [type, action] = message.type.split(".", 2);

    // For now we're only using long-lived connections
    // for handling "*.listen" messages
    // https://issues.adblockplus.org/ticket/6440/
    if (action !== "listen")
      return;

    listen(type, message.filter, uiPort, message.tabId);
  });
}
browser.runtime.onConnect.addListener(onConnect);
