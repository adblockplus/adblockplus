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
 * Options for cloning an object
 */
interface CloneOptions {
  /**
   * Whether to include functions in the cloned object
   */
  cloneFunctions?: boolean;
}

/**
 * Given an object defined in the content script, this creates a clone of
 * the object in the page script's scope, thereby making the clone accessible
 * to page scripts
 *
 * @param value - Object to clone
 * @param instanceClone - Context to create clone in
 * @param options - Clone options
 *
 * @returns clone of given object
 */
declare function cloneInto(
  value: any,
  instanceClone: Window | null,
  options?: CloneOptions
): any;
