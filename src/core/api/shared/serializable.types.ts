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
 * Serializable object of BlockableItem
 */
export interface SerializableBlockableItem {
  /**
   * Domain of document from which item originates
   */
  docDomain: string | null;
  /**
   * Whether item is a frame
   */
  isFrame: boolean;
  /**
   * Rewritten request URL
   */
  rewrittenUrl?: string;
  /**
   * Item type
   */
  type: string;
  /**
   * Item URL
   */
  url: string;
}

/**
 * Serializable object of Filter
 */
export interface SerializableFilter {
  /**
   * Content Security Policy to be injected.
   */
  csp: string | null;
  /**
   * Indicates whether this filter would be applied. Filters are enabled by
   * default. For comment filters this property is not set.
   */
  disabled?: boolean;
  /**
   * CSS selector for the HTML elements that will be hidden.
   */
  selector: string | null;
  /**
   * Indicates that this filter is not subject to an internal optimization.
   * Filters that are considered slow should be avoided.
   * Only URLFilters can be slow.
   */
  slow: boolean;
  /**
   * A {@link https://help.eyeo.com/adblockplus/how-to-write-filters|filter}
   * rule that specifies what content to block or to allow.
   * Used to identify a filter.
   */
  text: string;
  /**
   * The filter {@link https://gitlab.com/eyeo/adblockplus/abc/adblockpluscore/-/jobs/artifacts/0.6.0/file/build/docs/module-filterClasses.Filter.html?job=docs#type|type}
   */
  type: string;
}

/**
 * Serializable object of FilterError
 */
export interface SerializableFilterError {
  /**
   * The filter option that made the filter invalid.
   */
  option: string | null;
  /**
   * The reason why the filter is invalid.
   */
  reason: string;
  /**
   * Either invalid_filter or invalid_domain.
   */
  type: string;
}

/**
 * Serializable object of Recommendation
 */
export interface SerializableRecommendation {
  /**
   * The languages that this recommendation would match to.
   */
  languages: string[];
  /**
   * The display name of the recommended subscription.
   */
  title: string;
  /**
   * The kind of content targeted by this recommended subscription.
   */
  type: string;
  /**
   * Where the recommended subscription can be found in plain text.
   */
  url: string;
}

/**
 * Serializable object of Subscription
 */
export interface SerializableSubscription {
  /**
   * Indicates whether this subscription will be applied.
   */
  disabled: boolean;
  /**
   * Indicates whether the subscription is currently downloading (downloadble
   * subscriptions only).
   */
  downloading?: boolean;
  /**
   * The status of the most recent download attempt (downloadble subscriptions
   * only).
   */
  downloadStatus?: string;
  /**
   * Epoch time when the subscription must be downloaded (downloadble
   * subscriptions only).
   */
  expires?: number;
  /**
   * Website of the project that manages this filter list.
   */
  homepage?: string;
  /**
   * Epoch time when the subscription was last downloaded to your machine
   * (downloadble subscriptions only).
   */
  lastDownload?: number;
  /**
   * Epoch time when this subscription was last successfully downloaded
   * (downloadble subscriptions only).
   */
  lastSuccess?: number;
  /**
   * Epoch time for the next attempt to download the subscription. Can be
   * updated even if the subscription was not downloaded. If expires is closer,
   * then expires prevail. (downloadble subscriptions only).
   */
  softExpiration?: number;
  /**
   * The display name of the subscription. If not provided, falls back to the
   * URL.
   */
  title: string;
  /**
   * Indicates whether this subscription can be updated with either full or
   * diff update over the network. If false the subscription is merely a
   * container for user-defined filters.
   */
  updatable: boolean;
  /**
   * Where the subscription can be found in plain text. Used a the identifier.
   */
  url: string;
  /**
   * The version provided by the subscription's metadata. Defaults to '0' if not
   * provided. It might be set if the subscription is not downloadable.
   */
  version: string;
}
