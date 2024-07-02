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

import { type EventEmitterCallback } from "../../../polyfills/background";

/**
 * Cleans up messaging event handlers
 */
export type CleanupFunction = () => void;

/**
 * Uninstalls messaging event handler
 */
export type EventHandlerUninstall = () => void;

/**
 * Installs messaging event handler
 *
 * @param emit - Function to call for emitting an event
 * @param action - Event name
 * @param targetTabId - ID of tab for which events should be emitted
 *
 * @returns function for uninstalling messaging event handler
 */
export type EventHandlerInstall = (
  emit: EventEmitterCallback<unknown>,
  action: string,
  targetTabId: number | null
) => EventHandlerUninstall;

/**
 * Messaging event handler
 */
export interface EventHandler {
  /**
   * Function to be called to install messaging event handler
   */
  install: EventHandlerInstall;
  /**
   * Function to be called to uninstall messaging event handler
   */
  uninstall: EventHandlerUninstall | null;
}
