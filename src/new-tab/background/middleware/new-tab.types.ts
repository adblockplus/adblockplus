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
 * The method to use for creating the new tab.
 */
export enum CreationMethod {
  /**
   * `default` refers to the method implemented by earlier versions of the
   * command, and means waiting until the user opens a new, blank tab.
   */
  default = "default",
  /**
   * `force` means that the tab is to be created as soon as the extension
   * receives the command.
   */
  force = "force"
}

/**
 * The default creation method, in case the according parameter is omitted.
 */
export const defaultCreationMethod = CreationMethod.default;

/**
 * New tab behavior
 */
export interface NewTabBehavior extends LicenseStateBehavior {
  /**
   * Target page to open
   */
  target: string;
  /**
   * The method to use for opening the tab creation.
   */
  method: CreationMethod;
}

/**
 * New tab command parameters
 */
export interface NewTabParams {
  url: string;
  license_state_list?: string;
  method?: `${CreationMethod}`;
}

/**
 * A valid IPM command for an new tab command.
 */
export type NewTabCommand = Command & NewTabParams;
