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
 * Function called when allowlisting succeeds
 *
 * @param domain - Domain to allowlist
 */
const AllowlistingCallback: (domain: string) => void;

/**
 * Options for retrieving filters
 */
interface FiltersGetAllowingFiltersOptions {
  /**
   * ID of the frame to look up
   */
  frameId?: number = 0;
  /**
   * Types of filters to consider
   */
  types?: string[] = ["document"];
}

/**
 * Extra data associated with a filter
 */
interface FilterMetadata {
  // The SDK doesn't specify the type allowed for metadata entries
  [key: string]: any;
}

/**
 * Represents a single filter rule and its state.
 */
interface Filter {
  /**
   * A {@link https://help.eyeo.com/adblockplus/how-to-write-filters|filter}
   * rule that specifies what content to block or to allow.
   * Used to identify a filter.
   */
  text: string;
  /**
   * Indicates whether this filter would be applied. Filters are enabled by
   * default. For comment filters returned value is null.
   */
  enabled: boolean | null;
  /**
   * Indicates that this filter is not subject to an internal optimization.
   * Filters that are considered slow should be avoided.
   * Only URLFilters can be slow.
   */
  slow: boolean;
  /**
   * The filter {@link https://gitlab.com/eyeo/adblockplus/abc/adblockpluscore/-/jobs/artifacts/0.6.0/file/build/docs/module-filterClasses.Filter.html?job=docs#type|type}
   */
  type: string;
  /**
   * True when the filter applies to third-party, false to first-party,
   * null otherwise.
   */
  thirdParty: boolean | null;
  /**
   * CSS selector for the HTML elements that will be hidden.
   */
  selector: string | null;
  /**
   * Content Security Policy to be injected.
   */
  csp: string | null;
}

declare interface EWE {
  allowlisting: {
    /**
     * Sets the function called when allowlisting succeeds
     *
     * @param allowlistingCallback - User defined function that will be called
     */
    setAllowlistingCallback: (
      allowlistingCallback: AllowlistingCallback
    ) => void;

    /**
     * Updates the list of public keys used to verify allowlisting requests
     *
     * @param keys - New set of public keys
     */
    setAuthorizedKeys: (keys: string[]) => Promise<void>;
  };
  filters: {
    /**
     * Returns an extra data associated with a filter
     *
     * @param text - Filter text
     *
     * @returns filter metadata
     */
    getMetadata: (text: string) => Promise<?FilterMetadata>;
    /**
     * Returns an array of user filter objects
     *
     * @returns an array of user filter objects
     */
    getUserFilters: () => Promise<Filter[]>;
    /**
     * Removes one or multiple filters. The filters will no longer have
     * any effect and won't be returned by `filters.getUserFilters()`.
     * @param texts - The filter rules to be removed.
     */
    remove: (texts: string | string[]) => Promise<void>;
  };
}
