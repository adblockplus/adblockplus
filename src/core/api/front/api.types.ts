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

import Browser from "webextension-polyfill";
import { PremiumActivateOptions } from "../shared";

/**
 * Strings accepted for api.app.get's first prop
 */
export type AppGetWhat =
  | "acceptableAdsUrl"
  | "acceptableAdsPrivacyUrl"
  | "addonName"
  | "addonVersion"
  | "application"
  | "applicationVersion"
  | "ctalink"
  | "doclink"
  | "features"
  | "localeInfo"
  | "os"
  | "platform"
  | "platformVersion"
  | "recommendations"
  | "senderId";

/**
 * Options for opening UI page
 */
export interface AppOpenOptions {
  replaceTab?: boolean;
}

/**
 * Strings accepted for api.app.open's first prop
 */
export type AppOpenWhat = "options" | "premium-onboarding";

/**
 * Used by app.open and app.get, this uses the general
 * prop "what" to refer to the app name.
 */
interface AppReference {
  /**
   * Name of app to access.
   */
  what: string;
}

/**
 * Available display methods.
 */
export type DisplayMethod =
  | "critical"
  | "information"
  | "newtab"
  | "normal"
  | "relentless";

/**
 * Query parameters to be added in a URL
 */
export interface QueryParams {
  source?: string;
}

/**
 * Options for retrieving items blocked per page.
 */
interface GetBlockedPerPageOptions {
  /**
   * Name of the tab to get info on.
   */
  tab: string;
}

/**
 * Retrieves a specified cta link from the backend
 */
interface GetCtaLink {
  /**
   * The cta link name to retrieve
   */
  link: string;
  /**
   * Extra query parameters that should be added to the link
   */
  queryParams?: QueryParams;
  /**
   * Set this as a cta link command
   */
  what: "ctalink";
}

/**
 * Retrieves a specified doclink from the backend.
 */
interface GetDocLink {
  /**
   * The area of the link to return.
   */
  link: string;

  /**
   * Sets this as a doclink command.
   */
  what: "doclink";
}

/**
 * Notification retrieval options.
 */
interface GetNotificationOptions {
  /**
   * Desired display method.
   */
  displayMethod: DisplayMethod;
}

/**
 * Options for retrieving preferences.
 */
interface GetPrefsOptions {
  /**
   * Key to retrieve fron the prefs object.
   */
  key: string;
}

/**
 * Filter strings to be acted upon.
 */
export type ListenFilters = string[];

/**
 * Property configurations for the listen function
 */
export type ListenProps =
  | {
      /**
       * Filter strings to be acted upon.
       */
      filter: string[];

      /**
       * Used with
       */
      tabId: string;

      /**
       * Types of valid listen messages.
       */
      type: "requests";
    }
  | {
      /**
       * Filter strings to be acted upon.
       */
      filter: string[];

      /**
       * Types of valid listen messages.
       */
      type: "app" | "filters" | "prefs" | "premium" | "stats" | "subscriptions";
    };

/**
 * Types of valid listen messages.
 */
export type ListenTypes =
  | "app"
  | "filters"
  | "prefs"
  | "premium"
  | "requests"
  | "stats"
  | "subscriptions";

/**
 * Props sent into message listeners to determine how they are reacted upon
 */
export interface MessageProps {
  /**
   * This type is suboptimal as it is unclear exactly what
   * parameters can be in this object
   */
  [key: string]: any;

  /**
   * The type of message being sent
   */
  type: string;
}

/**
 * Static strings to match the browser engine to a store name.
 */
export interface PlatformToStore {
  chromium: "chrome";
  edgehtml: "edge";
  gecko: "firefox";
}

/**
 * A single platform name from the options available.
 */
export type Platform = keyof PlatformToStore;

/**
 * A single store name from the options available.
 */
export type Store = PlatformToStore[Platform] | "edge" | "opera";

/**
 * Basic plugin info
 */
export interface ExtensionInfo {
  /**
   * Appplication currently running the extension.
   */
  application: string;

  /**
   * Platform of the appplication currently running the extension.
   */
  platform: Platform;

  /**
   * Browser engine of the appplication currently running the extension.
   */
  store: Store;
}

/**
 * Subscription data sent through port messaging
 */
export interface PlainSubscription {
  /**
   * Indicates whether this subscription is downloaded and updated
   * over the network. If `false` the subscription is merely a container
   * for user-defined filters.
   */
  downloadable: boolean;
  /**
   * Indicates whether the subscription is currently downloading
   * (downloadable subscriptions only).
   */
  downloading?: boolean;
  /**
   * The {@link https://gitlab.com/eyeo/adblockplus/abc/adblockpluscore/-/jobs/artifacts/0.6.0/file/build/docs/module-subscriptionClasses.DownloadableSubscription.html?job=docs#downloadStatus|status}
   * of the most recent download attempt (downloadable subscriptions only).
   */
  downloadStatus?: string;
  /**
   * Indicates whether this subscription will be applied.
   */
  disabled: boolean;
  /**
   * Epoch time when the subscription must be downloaded
   * (downloadable subscriptions only).
   */
  expires?: number;
  /**
   * Website of the project that manages this filter list.
   */
  homepage?: string;
  /**
   * Epoch time when the subscription was last downloaded to your machine
   * (downloadable subscriptions only).
   */
  lastDownload?: number;
  /**
   * Epoch time when this subscription was last successfully downloaded
   * (downloadable subscriptions only).
   */
  lastSuccess?: number;
  /**
   * Epoch time for the next attempt to download the subscription. Can be
   * updated even if the subscription was not downloaded. If `expires`
   * is closer, then `expires` prevail. (downloadable subscriptions only).
   */
  softExpiration?: number;
  /**
   * The display name of the subscription. If not provided, falls back to the URL.
   */
  title: string;
  /**
   * Where the subscription can be found in plain text. Used as the identifier.
   */
  url: string;
  /**
   * The version provided by the subscription's metadata. Defaults to '0' if
   * not provided. It might be set if the subscription is not downloadable.
   */
  version: string;
}

/**
 * Port to access the browser runtime. Null if not set yet.
 */
export type Port = Browser.Runtime.Port | null;

/**
 * An event listener supplied to one of the api listeners
 */
export type PortEventListener = (options?: MessageProps) => void;

/**
 * Strings accepted for api.prefs.get's first prop
 */
export type PrefsGetWhat =
  | "currentVersion"
  | "documentation_link"
  | "blocked_total"
  | "show_statsinicon"
  | "shouldShowBlockElementMenu"
  | "ui_warn_tracking"
  | "show_devtools_panel"
  | "suppress_first_run_page"
  | "additional_subscriptions"
  | "last_updates_page_displayed"
  | "elemhide_debug"
  | "remote_first_run_page_url"
  | "recommend_language_subscriptions"
  | "premium_manage_page_url"
  | "premium_upgrade_page_url";

/**
 * Subscription recommendation
 */
export interface Recommendation {
  /**
   * List of matching languages
   */
  languages: string[];

  /**
   * Subscription title
   */
  title: string;

  /**
   * Recommendation type
   */
  type: string;

  /**
   * Subscription URL
   */
  url: string;
}

/**
 * Options sent to subscriptions.add
 */
export interface SubscriptionsAddOptions {
  /**
   * Whether user needs to confirm adding the subscription
   **/
  confirm?: boolean;

  /**
   * Subscription homepage URL
   **/
  homepage?: string;

  /**
   * Subscription title
   **/
  title?: string;

  /**
   * Subscription URL
   */
  url: string;
}

/**
 * Options sent into subscription.get.
 */
export interface SubscriptionsGetOptions {
  /**
   * Whether to return only the disabled filters.
   */
  disabledFilters?: boolean;

  /**
   * Whether or not to ignore filters that are disabled
   */
  ignoreDisabled?: boolean;
}

/**
 * Options sent to subscriptions.remove
 **/
export interface SubscriptionsRemoveOptions {
  /**
   * Subscription URL
   **/
  url: string;
}

/**
 * Available argument configurations for talking to the runtime.
 */
export type SendArgs =
  | AppReference
  | GetBlockedPerPageOptions
  | GetCtaLink
  | GetDocLink
  | GetNotificationOptions
  | GetPrefsOptions
  | PremiumActivateOptions
  | SubscriptionsAddOptions
  | SubscriptionsGetOptions
  | SubscriptionsRemoveOptions;

/**
 * Actions allowed to be sent into the browser.runtime.sendMessage.
 */
export type SendType =
  | "app.get"
  | "app.open"
  | "filters.get"
  | "notifications.get"
  | "notifications.seen"
  | "prefs.get"
  | "premium.activate"
  | "premium.get"
  | "stats.getBlockedPerPage"
  | "stats.getBlockedTotal"
  | "subscriptions.add"
  | "subscriptions.get"
  | "subscriptions.getInitIssues"
  | "subscriptions.getRecommendations"
  | "subscriptions.remove";
