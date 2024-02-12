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

import * as ewe from "@eyeo/webext-ad-filtering-solution";

import {
  type SerializableBlockableItem,
  type SerializableFilter,
  type SerializableFilterError,
  type SerializableRecommendation,
  type SerializableSubscription
} from "../shared";

/**
 * List of filter match methods that apply to requests
 */
const requestMethods = new Set(["allowing", "header", "request"]);

/**
 * Creates serializable blockable items object from given blockable item
 *
 * @param item - Blockable item
 *
 * @returns serializable blockable item object
 */

export function toSerializableBlockableItem(
  item: ewe.BlockableItem
): SerializableBlockableItem {
  const { filter, matchInfo, request } = item;
  const isFrame = !requestMethods.has(matchInfo.method);

  let type;
  if (matchInfo.method === "request") {
    type = ewe.reporting.contentTypesMap.get(request.type);
  } else if (matchInfo.method === "allowing") {
    type = matchInfo.allowingReason;
  } else if (typeof filter === "string") {
    // Show matching method when it had an effect on the request
    type = matchInfo.method;
  } else {
    type = ewe.reporting.contentTypesMap.get(request.type);
  }

  if (typeof type !== "string") {
    type = "other";
  }

  return {
    docDomain: matchInfo.docDomain,
    isFrame,
    rewrittenUrl: matchInfo.rewrittenUrl,
    type: type.toUpperCase(),
    url: request.url
  };
}

/**
 * Creates serializable filter object from given filter
 *
 * @param filter - Filter
 *
 * @returns serializable filter object
 */

export function toSerializableFilter(filter: ewe.Filter): SerializableFilter {
  const { csp, enabled, selector, slow, text, type } = filter;

  const serializable: SerializableFilter = {
    csp,
    selector,
    slow,
    text,
    type
  };

  // For the time being, we are renaming the enabled property to
  // make the UI compatible with EWE without having to rename it
  // in the UI code itself just yet
  // For the same reason, we're not adding the property for comment filters
  if (typeof enabled === "boolean") {
    serializable.disabled = !enabled;
  }

  return serializable;
}

/**
 * Creates serializable filter error object from given filter error
 *
 * @param filterError - Filter error
 *
 * @returns serializable filter error object
 */
export function toSerializableFilterError(
  filterError: ewe.FilterError
): SerializableFilterError {
  const { option, reason, type } = filterError;

  return {
    option,
    reason,
    type
  };
}

/**
 * Creates serializable recommendation object from given recommendation
 *
 * @param recommendation - Recommendation
 *
 * @returns serializable recommendation object
 */
export function toSerializableRecommendation(
  recommendation: ewe.Recommendation
): SerializableRecommendation {
  const { languages, title, type, url } = recommendation;

  return {
    languages,
    title,
    type,
    url
  };
}

/**
 * Creates serializable subscription object from given subscription
 *
 * @param subscription - Subscription
 *
 * @returns serializable subscription object
 */
export function toSerializableSubscription(
  subscription: ewe.Subscription
): SerializableSubscription {
  const {
    downloading,
    downloadStatus,
    enabled,
    expires,
    homepage,
    lastDownload,
    lastSuccess,
    softExpiration,
    title,
    updatable,
    url,
    version
  } = subscription;

  return {
    // For the time being, we are renaming the enabled property to
    // make the UI compatible with EWE without having to rename it
    // in the UI code itself just yet
    disabled: !enabled,
    downloading,
    downloadStatus,
    expires,
    homepage,
    lastDownload,
    lastSuccess,
    softExpiration,
    title,
    updatable,
    url,
    version
  };
}
