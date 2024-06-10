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

import type { Behavior, Command } from "./command-library.types";

/**
 * Delete-commands behavior
 */
export interface DeleteBehavior extends Behavior {
  /**
   * List of IPM command IDs to delete
   */
  commandIds: string[];
}

/**
 * Parameter key value to delete all commands
 */
export const deleteAllKey = "__all__";

/**
 * Delete-commands IPM command parameters
 */
export interface DeleteParams {
  commands: string;
}

/**
 * A valid IPM command to delete commands
 */
export type DeleteCommand = Command & DeleteParams;
