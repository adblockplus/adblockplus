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

/**
 * Message object, as passed from/to background page
 */
export interface Message {
  type: string;
}

/**
 * Message object for "*.listen" types
 */
export interface ListenMessage extends Message {
  /**
   * List of event names to listen to
   */
  filter: string[];
  /**
   * ID of tab for which to listen to events
   */
  tabId?: number;
}

/**
 * Options for activating Premium license
 */
export interface PremiumActivateOptions {
  /**
   * Premium user ID
   */
  userId: string;
}

/**
 * Options for adding/removing Premium subscription
 */
export interface PremiumSubscriptionsAddRemoveOptions {
  subscriptionType: "cookies-premium" | "annoyances";
}
