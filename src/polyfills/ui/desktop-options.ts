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
  type CollectionSubscription,
  type InitialRecommendedSubscription,
  type RecommendedPlainSubscription
} from "./desktop-options.types";

/**
 * Checks if an item is of type InitialRecommendedSubscription
 *
 * @param item - the item to check
 *
 * @returns Whether the item is of type InitialRecommendedSubscription or not
 */
function isInitialRecommendedSubscription(
  item: unknown
): item is InitialRecommendedSubscription {
  return (
    item !== null &&
    typeof item === "object" &&
    "disabled" in item &&
    "downloadStatus" in item &&
    "homepage" in item &&
    "languages" in item &&
    "recommended" in item &&
    "title" in item &&
    "url" in item
  );
}

/**
 * Checks if an item is of type RecommendedPlainSubscription
 *
 * @param item - the item to check
 *
 * @returns Whether the item is of type RecommendedPlainSubscription or not
 */
function isRecommendedPlainSubscription(
  item: unknown
): item is RecommendedPlainSubscription {
  return (
    item !== null &&
    typeof item === "object" &&
    "disabled" in item &&
    "downloadable" in item &&
    "languages" in item &&
    "recommended" in item &&
    "title" in item &&
    "url" in item &&
    "version" in item
  );
}

/**
 * Checks if an item is of type CollectionSubscription
 *
 * @param item - the item to check
 *
 * @returns Whether the item is of type CollectionSubscription or not
 */
export function isCollectionSubscription(
  item: unknown
): item is CollectionSubscription {
  return (
    isInitialRecommendedSubscription(item) ||
    isRecommendedPlainSubscription(item)
  );
}
