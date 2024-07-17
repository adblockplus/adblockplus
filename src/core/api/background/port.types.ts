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

import { type Frame, type MessageEmitter } from "../shared";

/**
 * Observed web extension API message sender object due to outdated type package
 */
export interface BrowserMessageSenderWithOrigin
  extends browser.Runtime.MessageSender {
  origin?: string;
}

/**
 * Message emitter in background context
 */
export type BackgroundMessageEmitter = MessageEmitter<MessageSender>;

/**
 * Message sender
 */
export interface MessageSender {
  /**
   * Sender frame information
   */
  frame?: Frame | null;
  /**
   * Sender frame ID
   */
  frameId: browser.Runtime.MessageSender["frameId"];
  /**
   * Sender tab information
   */
  tab: browser.Runtime.MessageSender["tab"];
}
