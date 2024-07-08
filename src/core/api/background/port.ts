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
import { type Message } from "../shared";
import { type MessageSender } from "./api.types";
import { type PortMessageListener } from "./port.types";

/**
 * Communication port wrapping ext.onMessage to receive messages.
 */
class Port {
  /**
   * Internal event emitter
   */
  private readonly eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.onMessage = this.onMessage.bind(this);
    ext.onMessage.addListener(this.onMessage);
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
      return ext.getMessageResponse(responses);
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
  on(name: string, listener: PortMessageListener): void {
    this.eventEmitter.on(name, listener);
  }

  /**
   * Removes a listener for the specified message.
   *
   * @param name - Event name
   * @param listener - Event listener
   */
  off(name: string, listener: PortMessageListener): void {
    this.eventEmitter.off(name, listener);
  }

  /**
   * Disables the port and makes it stop listening to incoming messages.
   */
  disconnect(): void {
    ext.onMessage.removeListener(this.onMessage);
  }
}

/**
 * The default port to receive messages.
 */
export const port = new Port();
