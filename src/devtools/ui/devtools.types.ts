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

import { DevtoolsPanels } from "webextension-polyfill/namespaces/devtools_panels";

/**
 * Function called upon a search action (start of a new search, search result
 * navigation, or search being canceled).
 **/
type SearchListener = (action: string, queryString?: string) => any;

/**
 * Chromium-specific ExtensionPanel search functionality
 */
interface SearchExtension {
  /**
   * Fired upon a search action (start of a new search, search result
   * navigation, or search being canceled).
   **/
  onSearch?: {
    addListener: (callback: SearchListener) => void;
  };
}

/**
 * Represents a panel created by extension,
 * including Chromium-specific functionality
 */
export type ExtensionPanelWithSearch = DevtoolsPanels.ExtensionPanel &
  SearchExtension;
