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
import type {
  ListenProps,
  MessageProps,
  Port,
  PortEventListener
} from "./api.types";

declare const browser: Browser.Browser;

/**
 * The browser.runtime port.
 */
let port: Port;

/**
 * A set of connection listeners
 */
const connectListeners: Set<PortEventListener> = new Set();

/**
 * A set of disconnection listeners
 */
const disconnectListeners: Set<PortEventListener> = new Set();

/**
 * A set of message listeners
 */
const messageListeners: Set<PortEventListener> = new Set();

/**
 * Adds a connect listener to the appropriate set.
 *
 * This also fires the listener as at the point on adding it we have already connected
 *
 * @param listener supplied callback to be fired on connect
 */
export function addConnectListener(listener: PortEventListener) {
  connectListeners.add(listener);
  listener();
}

/**
 * Adds a disconnect listener to the appropriate set
 *
 * @param listener supplied callback to be fired on disconnectconnect
 */
export function addDisconnectListener(listener: PortEventListener) {
  disconnectListeners.add(listener);
}

/**
 * Adds a message listener to the appropriate set
 *
 * @param listener supplied callback to be fired on recieving a message
 */
export function addMessageListener(listener: PortEventListener) {
  messageListeners.add(listener);
}

/**
 * Connects the port and sets message and disconnect listeners
 */
export const connect = (): Port | null => {
  // We're only establishing one connection per page, for which we need to
  // ignoresubsequent connection attempts
  if (port) return port;

  try {
    port = browser.runtime.connect({ name: "ui" });
  } catch (ex) {
    // We are no longer able to connect to the background page, so we give up
    // and assume that the extension is gone
    port = null;

    disconnectListeners.forEach((listener) => listener());

    return port;
  }

  port.onMessage.addListener((message: MessageProps) => {
    onMessage(message);
  });

  port.onDisconnect.addListener(onDisconnect);

  connectListeners.forEach((listener) => listener());

  return port;
};

/**
 * Adds connect listeners of a supplied type
 *
 * @param props.type the type of listen event. dictates how the port will respond
 * @param props.filter Filter strings to be acted upon.
 * @param ...options Other properties that may be passed, depending on type
 */
export function listen({ type, filter, ...options }: ListenProps) {
  addConnectListener(() => {
    if (port) {
      port.postMessage({
        type: `${type}.listen`,
        filter,
        ...options
      });
    }
  });
}

/**
 * When the connection to the background page drops, we try to reconnect,
 * assuming that the extension is still there, in order to wake up the
 * service worker
 */
function onDisconnect() {
  port = null;
  // If the disconnect occurs due to the extension being unloaded, we may
  // still be able to reconnect while that's ongoing, which misleads us into
  // thinking that the extension is still there. Therefore we need to wait
  // a little bit before trying to reconnect.
  // https://bugs.chromium.org/p/chromium/issues/detail?id=1312478
  setTimeout(() => connect(), 100);
}

/**
 * When the port receives a message, if the type end in .respond,
 * all message listeners are fired
 *
 * @param message props including type, passed on to the message listeners
 */
function onMessage(message: MessageProps) {
  if (!message.type.endsWith(".respond")) return;

  messageListeners.forEach((listener) => listener(message));
}

/**
 * Stops a disconnect listener from firing listening
 *
 * @param listener disconnect listener to remove
 */
export function removeDisconnectListener(listener: PortEventListener) {
  disconnectListeners.delete(listener);
}
