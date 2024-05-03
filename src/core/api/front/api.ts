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

import { type InjectionInfo } from "../../../info-injector/shared";
import { type Info } from "../../../info/background/info.types";
import { type PremiumState } from "../../../premium/shared";
import {
  addDisconnectListener,
  addMessageListener,
  connect,
  listen,
  removeDisconnectListener
} from "./api.port";
import type {
  AppGetWhat,
  AppOpenOptions,
  AppOpenWhat,
  DisplayMethod,
  ListenFilters,
  ExtensionInfo,
  Platform,
  PlatformToStore,
  PrefsGetWhat,
  QueryParams,
  Recommendation,
  SendArgs,
  SendType,
  Store,
  SubscriptionsGetOptions,
  PremiumSubscriptionsTypes
} from "./api.types";

/**
 * All the Platforms with their store name.
 */
const platformToStore: Readonly<Partial<PlatformToStore>> = {
  chromium: "chrome",
  edgehtml: "edge",
  gecko: "firefox"
};

/**
 * A collection of browser.runtime apis for app information.
 */
export const app = {
  /**
   * retrieves app information corresponding to the passed string
   *
   * @param what which item of information to return
   *
   * @returns app information
   */
  get: async <T = string>(what: AppGetWhat) =>
    await send<T>("app.get", { what }),

  /**
   * gets and returns basic relevant information of
   * the current instance of the extension
   */
  getInfo: async (): Promise<ExtensionInfo> => {
    return await Promise.all([
      app.get("application"),
      app.get("platform")
    ]).then(([application, rawPlatform]) => {
      const platform = rawPlatform as Platform;

      let store: Store;

      // Edge and Opera have their own stores so we should refer to those instead
      if (application !== "edge" && application !== "opera") {
        store = platformToStore[platform] ?? "chrome";
      } else {
        store = application;
      }

      return {
        application,
        manifestVersion: browser.runtime.getManifest().manifest_version,
        platform,
        store
      };
    });
  },

  /**
   * Adds a connection Listener for the "app"
   *
   * @param filter Filters to listen for
   */
  listen: (filter: ListenFilters) => {
    listen({ type: "app", filter });
  },

  /**
   * Opens an app page according to the passed string
   *
   * @param what which app page to open
   */
  open: async (what: AppOpenWhat, options: AppOpenOptions = {}) =>
    await send("app.open", { what, ...options })
};

/**
 * A collection of browser.runtime apis for ctalinks
 */
export const ctalinks = {
  /**
   * Retrieves a cta link
   *
   * @param link cta link name to retrieve
   * @param queryParams extra query parameters that should be added to the link
   *
   * @returns cta link
   */
  get: async (link: string, queryParams: QueryParams = {}) =>
    await send<string>("app.get", { what: "ctalink", link, queryParams })
};

/**
 * A collection of browser.runtime apis for docLinks.
 */
export const doclinks = {
  /**
   * Retrieves a link to a particular help area.
   *
   * @param link which link to retrieve
   */
  get: async (link: string) => await send("app.get", { what: "doclink", link })
};

/**
 * A collection of browser.runtime apis for filters.
 */
export const filters = {
  /**
   * Gets the currently active filters.
   */
  get: async () => await send("filters.get"),
  /**
   * Adds a connection Listener for the "filters"
   *
   * @param filter Filters to listen for
   */
  listen: (filter: ListenFilters) => {
    listen({ type: "filters", filter });
  }
};

/**
 * A collection of browser.runtime apis for notifications.
 */
export const notifications = {
  /**
   * Gets all active notifications that can be displayed in the supplied way.
   *
   * @param displayMethod the way the notification intends to be displayed
   */
  get: async (displayMethod: DisplayMethod) =>
    await send("notifications.get", { displayMethod }),
  /**
   * Marks all active notifications as seen.
   */
  seen: async () => await send("notifications.seen")
};

/**
 * A collection of browser.runtime apis for preferences.
 */
export const prefs = {
  /**
   * Gets a specific preference setting according to the provided key.
   *
   * @returns preference value
   */
  get: async <T>(key: PrefsGetWhat) => await send<T>("prefs.get", { key }),

  /**
   * Adds a connection Listener for the "prefs"
   *
   * @param filter Filters to listen for
   */
  listen: (filter: ListenFilters) => {
    listen({ type: "prefs", filter });
  }
};

/**
 * A collection of browser.runtime APIs for Premium
 */
export const premium = {
  /**
   * Triggers activation of Premium license with the given user ID
   *
   * @param userId - Premium user ID
   *
   * @returns whether activating Premium was successful
   */
  activate: async (userId: string) =>
    await send<boolean>("premium.activate", { userId }),

  /**
   * Retrieves the current Premium state
   *
   * @returns Premium state
   */
  get: async () => await send<PremiumState>("premium.get"),

  /**
   * Add a premium subscription
   * @returns void
   */
  add: async (
    subscriptionType: PremiumSubscriptionsTypes["subscriptionType"]
  ) => {
    await send("premium.subscriptions.add", { subscriptionType });
  },

  /**
   * Removes a premium subscription
   *
   * @returns Premium state
   */
  remove: async (
    subscriptionType: PremiumSubscriptionsTypes["subscriptionType"]
  ) => {
    await send("premium.subscriptions.remove", { subscriptionType });
  },

  /**
   * Adds a connection listener for the Premium state
   *
   * @param filter - Filters what to listen for
   */
  listen: (filter: ListenFilters) => {
    listen({ type: "premium", filter });
  }
};

/**
 * A collection of browser.runtime apis for requests.
 */
export const requests = {
  /**
   * Adds a connection Listener for the "requests"
   *
   * @param filter Filters to listen for
   * @param tabId tab to listen for changes on
   */
  listen: (filter: ListenFilters, tabId: string) => {
    listen({ type: "requests", filter, tabId });
  }
};

/**
 * Sends messages into the browser runtime.
 *
 * @param sendType accepted message strings
 * @param rawArgs other arguments to be sent to the browser
 */
async function send<T = unknown>(
  sendType: SendType,
  rawArgs: SendArgs = {}
): Promise<T> {
  const args = {
    ...rawArgs,
    type: sendType
  };
  return await browser.runtime.sendMessage(args);
}

/**
 * A collection of browser.runtime apis for stats.
 */
export const stats = {
  /**
   * Returns the amount of blocked requests on a specific page.
   *
   * @param tab
   */
  getBlockedPerPage: async (tab: string) =>
    await send("stats.getBlockedPerPage", { tab }),
  /**
   * Returns the total amount of blocked requests.
   */
  getBlockedTotal: async () => await send("stats.getBlockedTotal"),
  /**
   * Adds a connection Listener for the "stats"
   *
   * @param filter Filters to listen for
   */
  listen: (filter: ListenFilters) => {
    listen({ type: "stats", filter });
  }
};

/**
 * A collection of browser.runtime apis for subscriptions.
 */
export const subscriptions = {
  /**
   * Adds the given subscription
   *
   * @param url - Subscription URL
   */
  add: async (url: string) => await send("subscriptions.add", { url }),
  /**
   * Retrieves the currently active subscriptions.
   *
   * @param options an object full of props to filter reported subscriptions
   */
  get: async (options?: SubscriptionsGetOptions) =>
    await send("subscriptions.get", options),
  /**
   * Returns any initial subscription issues that may exist.
   */
  getInitIssues: async () => await send("subscriptions.getInitIssues"),
  /**
   * Retrieves a list of recommended subscriptions
   *
   * @returns list of recommended subscriptions
   */
  getRecommendations: async () =>
    await send<Recommendation[]>("subscriptions.getRecommendations"),

  /**
   * Adds a connection Listener for the "subscriptions"
   *
   * @param filter Filters to listen for
   */
  listen: (filter: ListenFilters) => {
    listen({ type: "subscriptions", filter });
  },

  /**
   * Removes the given subscription
   *
   * @param url - Subscription URL
   */
  remove: async (url: string) => await send("subscriptions.remove", { url })
};

/**
 * A collection of browser.runtime apis for info.
 */
export const info = {
  /**
   * Returns the browser platform information.
   */
  get: async () => await send<Info>("info.get"),
  /**
   * Returns the information to be injected on product websites.
   */
  getInjectionInfo: async () =>
    await send<InjectionInfo>("info.getInjectionInfo")
};

/**
 * Due to the generic nature of the api naming as well as the context of
 * usage, it is better to import all the methods as a whole
 * and use the object.
 */
const api = {
  addDisconnectListener,
  addListener: addMessageListener,
  app,
  ctalinks,
  doclinks,
  filters,
  notifications,
  prefs,
  premium,
  requests,
  removeDisconnectListener,
  subscriptions,
  stats
};

/**
 * The browser.runtime port, is connected at runtime  by the connect function
 */
connect();

export default api;
