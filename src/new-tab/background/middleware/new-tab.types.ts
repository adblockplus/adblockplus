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

import {
  type LicenseStateBehavior,
  type Command
} from "../../../ipm/background";

/**
 * New tab event names
 */
export enum NewTabEventType {
  created = "tab_created",
  loaded = "tab_loaded"
}

/**
 * New tab error event names
 */
export enum NewTabErrorEventType {
  noBehaviorFound = "error_no_behavior",
  licenseStateNoMatch = "license_state_no_match",
  noUrlFound = "error_no_url",
  tabCreationError = "tab_creation_error"
}

/**
 * New tab exit event names
 */
export enum NewTabExitEventType {
  admin = "newtab_admin"
}

/**
 * New tab behavior
 */
export interface NewTabBehavior extends LicenseStateBehavior {
  /**
   * Target page to open
   */
  target: string;
}

/**
 * New tab command parameters
 */
export interface NewTabParams {
  url: string;
  license_state_list?: string;
}

/**
 * A valid IPM command for an new tab command.
 */
export type NewTabCommand = Command & NewTabParams;
