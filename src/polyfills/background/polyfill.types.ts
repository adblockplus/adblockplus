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

/**
 * Temporary type for shortened EventEmitter callback,
 * as passed to us by installHandler()
 *
 * @param arg - Argument to pass along to event listeners
 */
export type EventEmitterCallback<T> = (arg: T) => void;

/**
 * Temporary interface for metadata object that we attach to custom filters
 */
export interface FilterMetadata {
  /**
   * Filter creation date
   */
  created: number;
  /**
   * Filter origin
   */
  origin: string;
}

/**
 * Temporary interface for sender object, as passed to us via callback by
 * browser.runtime.sendMessage()
 */
export interface MessageSender {
  /**
   * Information about sender frame
   */
  frame: {
    /**
     * Sender frame ID
     */
    id: number;
  };
  /**
   * Information about sender page
   */
  page: {
    /**
     * Sender page ID (same as tab ID)
     */
    id: number;
    /**
     * Sender page URL
     */
    url: URL;
  };

  /**
   * Information about sender tab
   */
  tab: Tabs.Tab;
}

/**
 * Temporary interface for "tab-removed" event data from TabSessionStorage
 */
export interface TabRemovedEventData {
  /**
   * Tab ID of removed tab
   */
  tabId: number;
  /**
   * Stored session data for removed tab
   */
  value: unknown;
}
