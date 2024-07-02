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

import { type Browser } from "webextension-polyfill";

declare global {
  /**
   * Global extension utilities
   */
  declare namespace ext {
    /**
     * Adds trusted message types for certain origins
     *
     * @param origin - URL origin of sender page
     * @param types - Message types to trust for given origin
     */
    const addTrustedMessageTypes: (
      origin: string | null,
      types: string[]
    ) => void;

    /**
     * Determines whether given message sender can be trusted
     *
     *  @param sender - Message sender
     *  @returns whether given message sender can be trusted
     */
    const isTrustedSender: (sender: Browser.Runtime.MessageSender) => boolean;
  }
}
