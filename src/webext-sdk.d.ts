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
  frameId?: number;
  /**
   * Types of filters to consider
   */
  types?: string[];
}

/**
 * Extra data associated with a filter.
 *
 * The SDK doesn't specify the type allowed for metadata entries.
 */
type FilterMetadata = Record<string, any>;

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

/**
 * Defines the recommended filter subscriptions per language.
 */
interface Recommendation {
  /**
   * The identifier for this subscription.
   */
  id: string;
  /**
   * The languages that this recommendation would match to.
   */
  languages: string[];
  /**
   * The display name of the recommended subscription.
   */
  title: string;
  /**
   *  A list of subscriptions that this one depends on.
   */
  requires: string[];
  /**
   * A list of subscriptions that this one also contains.
   */
  includes: string[];
  /**
   * The kind of content targeted by this recommended subscription.
   */
  type: string;
  /**
   * Where the recommended subscription can be found in plain text.
   */
  url: string;
  /**
   * Where the recommended subscription can be found for MV2 in plain text
   * (Manifest V3 only).
   */
  mv2URL?: string;
}

declare module "@eyeo/webext-sdk" {
  declare namespace allowlisting {
    /**
     * Sets the function called when allowlisting succeeds
     *
     * @param allowlistingCallback - User defined function that will be called
     */
    const setAllowlistingCallback: (
      allowlistingCallback: AllowlistingCallback
    ) => void;

    /**
     * Updates the list of public keys used to verify allowlisting requests
     *
     * @param keys - New set of public keys
     */
    const setAuthorizedKeys: (keys: string[]) => Promise<void>;
  }

  declare namespace filters {
    /**
     * Returns the allowing filters that will be effective when the given
     * document will be reloaded
     */
    const getAllowingFilters: (
      /**
       * ID of tab to look up
       */
      tabId: number,
      /**
       * Options for retrieving filters
       */
      options?: FiltersGetAllowingFiltersOptions
    ) => Promise<string[]>;
    /**
     * Returns an extra data associated with a filter
     *
     * @param text - Filter text
     *
     * @returns filter metadata
     */
    const getMetadata: (text: string) => Promise<?FilterMetadata>;
    /**
     * Returns an array of user filter objects
     *
     * @returns an array of user filter objects
     */
    const getUserFilters: () => Promise<Filter[]>;
    /**
     * Removes one or multiple filters. The filters will no longer have
     * any effect and won't be returned by `filters.getUserFilters()`.
     * @param texts - The filter rules to be removed.
     */
    const remove: (texts: string | string[]) => Promise<void>;
  }

  declare namespace notifications {
    /**
     * Returns the list of ignored notification categories
     */
    const getIgnoredCategories: () => Promise<string[]>;
  }

  declare namespace subscriptions {
    /**
     * Checks if a subscription has been added.
     *
     * @param url - The URL of the subscription to be checked.
     */
    const has: (url: string) => Promise<boolean>;
    /**
     * Removes the subscription for the given URL. It will no longer have
     * any effect.
     *
     * @param url - The URL of the subscription to be removed.
     */
    const remove: (url: string) => Promise<void>;
    /**
     * Returns an array of all recommended subscriptions.
     */
    const getRecommendations: () => Recommendation[];
  }
}
