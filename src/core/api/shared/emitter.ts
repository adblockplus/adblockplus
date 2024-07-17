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

import { type Message } from "./api.types";
import { type MessageListener } from "./emitter.types";

/**
 * Message emitter
 */
export class MessageEmitter<T> {
  /**
   * Message listeners
   */
  private readonly listeners: Set<MessageListener<T>>;

  constructor() {
    this.listeners = new Set();
  }

  /**
   * Start listening to messages
   *
   * @param listener - Message listener
   */
  addListener(listener: MessageListener<T>): void {
    this.listeners.add(listener);
  }

  /**
   * Stop listening to messages
   *
   * @param listener - Message listener
   */
  removeListener(listener: MessageListener<T>): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify event listeners of message
   *
   * @param message - Message
   * @param sender - Message sender
   * @returns results - Message handler responses
   */
  dispatch(message: Message, sender: T): unknown[] {
    const results = [];
    for (const listener of this.listeners) {
      results.push(listener(message, sender));
    }
    return results;
  }
}
