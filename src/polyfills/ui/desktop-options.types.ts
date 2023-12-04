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

import { type PlainSubscription } from "../../core/api/front";

/**
 * Initial data for a recommended subscription, that hasn't been installed yet,
 * and is being consumed in the options page
 */
export interface InitialRecommendedSubscription {
  /**
   * Indicates whether this subscription will be applied.
   */
  disabled: boolean;
  /**
   * The {@link https://gitlab.com/eyeo/adblockplus/abc/adblockpluscore/-/jobs/artifacts/0.6.0/file/build/docs/module-subscriptionClasses.DownloadableSubscription.html?job=docs#downloadStatus|status}
   * of the most recent download attempt (downloadable subscriptions only).
   */
  downloadStatus: null;
  /**
   * Website of the project that manages this filter list.
   */
  homepage: null;
  /**
   * The languages that this recommendation would match to.
   */
  languages: string[];
  /**
   * The kind of content targeted by this recommended subscription.
   */
  recommended: string;
  /**
   * The display name of the subscription. If not provided, falls back to the URL.
   */
  title: string;
  /**
   * Where the subscription can be found in plain text. Used as the identifier.
   */
  url: string;
}

/**
 * Recommended subscription data consumed in the options page
 */
export interface RecommendedPlainSubscription extends PlainSubscription {
  /**
   * The languages that this recommendation would match to.
   */
  languages: string[];
  /**
   * The kind of content targeted by this recommended subscription.
   */
  recommended: string;
}

/**
 * Subscription type for items that are stored in Collection objects in the options page
 */
export type CollectionSubscription =
  | InitialRecommendedSubscription
  | RecommendedPlainSubscription;
