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
 * Then tab event types we want to listen to.
 */
export enum ListenerType {
  create = "create",
  update = "update",
  remove = "remove"
}

/**
 * A generic function signature for a tab event listener.
 */
export type Listener = (...args: any[]) => void;

/**
 * A map that maps the type of a listener to the listener itself.
 */
export type ListenerSet = Record<ListenerType, Listener>;

/**
 * Event names for successful tab creation.
 */
export enum CreationSuccess {
  created = "tab_created",
  loaded = "tab_loaded"
}

/**
 * Event names for when we couldn't create a tab.
 */
export enum CreationError {
  invalidBehavior = "error_no_behavior",
  licenseStateMismatch = "license_state_no_match",
  invalidURL = "error_no_url",
  tabCreationError = "tab_creation_error"
}

/**
 * Event names for when we decided not to create a tab.
 */
export enum CreationRejection {
  admin = "newtab_admin"
}
