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

import { EventEmitter } from "../../../../adblockpluschrome/lib/events";
import {
  type Message,
  getMessageResponse,
  isMessage,
  MessageEmitter
} from "../shared";
import { type MessageListener } from "../shared/emitter.types";
import {
  type BackgroundMessageEmitter,
  type BrowserMessageSenderWithOrigin,
  type MessageSender
} from "./port.types";

/**
 * Message emitter instance for use in background context
 */
export const messageEmitter: BackgroundMessageEmitter = new MessageEmitter();
/**
 * Extension's own origin
 */
const selfOrigin = new URL(browser.runtime.getURL("")).origin;
/**
 * Map containing trusted message types for any given origin
 */
const trustedTypesByOrigin = new Map();

/**
 * Communication port wrapping message emitter to receive messages.
 */
class Port {
  /**
   * Internal event emitter
   */
  private readonly eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.onMessage = this.onMessage.bind(this);
    messageEmitter.addListener(this.onMessage);
  }

  /**
   * Internal function for handling incoming messages
   *
   * @param message - Message
   * @param sender - Message sender
   *
   * @returns message response, if any
   */
  private onMessage(message: Message, sender: MessageSender): unknown {
    const listeners = this.eventEmitter.listeners(message.type);

    try {
      const responses = listeners.map((listener) => listener(message, sender));
      return getMessageResponse(responses);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Forwards a received message to a different endpoint, as indicated by the
   * given message type
   *
   * @param type - Message type to forward message to
   * @param message - Message to forward
   * @param sender - Message sender
   *
   * @returns message response, if any
   */
  forward(type: string, message: Message, sender: MessageSender): unknown {
    return this.onMessage(Object.assign({}, message, { type }), sender);
  }

  /**
   * Adds a listener for the specified message.
   *
   * The return value of the listener (if not undefined) is sent as response.
   * @param name - Event name
   * @param listener - Event listener
   */
  on(name: string, listener: MessageListener<MessageSender>): void {
    this.eventEmitter.on(name, listener);
  }

  /**
   * Removes a listener for the specified message.
   *
   * @param name - Event name
   * @param listener - Event listener
   */
  off(name: string, listener: MessageListener<MessageSender>): void {
    this.eventEmitter.off(name, listener);
  }

  /**
   * Disables the port and makes it stop listening to incoming messages.
   */
  disconnect(): void {
    messageEmitter.removeListener(this.onMessage);
  }
}

/**
 * The default port to receive messages.
 */
export const port = new Port();

/**
 * Specify message types that we allow only for certain origins.
 *
 * @param origin - Sender origin (any if `null`)
 * @param types - Trusted message types for given origin
 */
export function addTrustedMessageTypes(
  origin: string | null,
  types: string[]
): void {
  if (!trustedTypesByOrigin.has(origin)) {
    trustedTypesByOrigin.set(origin, []);
  }

  const trustedTypes = trustedTypesByOrigin.get(origin);
  trustedTypes.push(...types);
}

/**
 * Determines origin of given message sender
 *
 * @param sender - Message sender
 * @returns message sender origin
 */
function getSenderOrigin(
  sender: BrowserMessageSenderWithOrigin
): string | null {
  // Firefox (at least up to version 105) doesn't support MessageSender.origin
  if (sender.origin) {
    return sender.origin;
  }

  if (!sender.url) {
    return null;
  }

  return new URL(sender.url).origin;
}

/**
 * Determines whether given message type can be trusted for given origin
 *
 * @param origin - Origin
 * @param type - Message type
 * @returns whether given message type can be trusted for given origin
 */
function isTrustedMessageType(origin: string | null, type: string): boolean {
  const trustedTypes = trustedTypesByOrigin.get(origin);
  return !!trustedTypes && trustedTypes.includes(type);
}

/**
 * Determines whether given message sender can be trusted
 *
 *  @param sender - Message sender
 *  @returns whether given message sender can be trusted
 */
export function isTrustedSender(
  sender: browser.Runtime.MessageSender
): boolean {
  return getSenderOrigin(sender) === selfOrigin;
}

/**
 * Handles incoming messages
 *
 * @param message - Message
 * @param rawSender - Message sender as provided by the browser
 * @returns message response (if any)
 */
function onMessage(
  message: unknown,
  rawSender: browser.Runtime.MessageSender
): Promise<unknown> | undefined {
  // Ignore invalid messages
  if (!isMessage(message)) {
    return;
  }

  // Ignore messages from EWE & ML content scripts
  if (message.type.startsWith("ewe:") || message.type.startsWith("ML:")) {
    return;
  }

  // Ignore messages from content scripts, unless we listed them as
  // safe to use in the context they're running in
  if (
    !isTrustedSender(rawSender) &&
    !isTrustedMessageType(getSenderOrigin(rawSender), message.type) &&
    !isTrustedMessageType(null, message.type)
  ) {
    console.warn("Untrusted message received", message.type, rawSender.url);
    return;
  }

  const sender: MessageSender = {
    frameId: rawSender.frameId,
    tab: rawSender.tab
  };
  const responses = messageEmitter.dispatch(message, sender);
  const response = getMessageResponse(responses);
  if (typeof response === "undefined") {
    return;
  }

  return Promise.resolve(response);
}

/**
 * Initializes message handling functionality
 */
function start(): void {
  browser.runtime.onMessage.addListener(onMessage);
}

start();
