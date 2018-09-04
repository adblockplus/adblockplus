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

"use strict";

(function()
{
  function EventEmitter()
  {
    this._listeners = Object.create(null);
  }
  EventEmitter.prototype = {
    on(name, listener)
    {
      if (name in this._listeners)
        this._listeners[name].push(listener);
      else
        this._listeners[name] = [listener];
    },
    off(name, listener)
    {
      const listeners = this._listeners[name];
      if (listeners)
      {
        const idx = listeners.indexOf(listener);
        if (idx != -1)
          listeners.splice(idx, 1);
      }
    },
    emit(name, ...args)
    {
      const listeners = this._listeners[name];
      if (listeners)
      {
        for (const listener of listeners)
          listener(...args);
      }
    }
  };

  function updateFromURL(data)
  {
    if (window.location.search)
    {
      const params = window.location.search.substr(1).split("&");

      for (const param of params)
      {
        const parts = param.split("=", 2);
        if (parts.length == 2 && parts[0] in data)
          data[parts[0]] = decodeURIComponent(parts[1]);
      }
    }
  }

  const params = {
    additionalSubscriptions: "",
    blockedURLs: "",
    dataCorrupted: false,
    filterlistsReinitialized: false,
    addSubscription: false,
    filterError: false,
    downloadStatus: "synchronize_ok",
    showNotificationUI: false,
    showPageOptions: false
  };
  updateFromURL(params);

  const subscriptionServer = "https://easylist-downloads.adblockplus.org";
  const easyListGermany = `${subscriptionServer}/easylistgermany+easylist.txt`;
  const acceptableAds = `${subscriptionServer}/exceptionrules.txt`;
  const acceptableAdsPrivacyFriendly =
    `${subscriptionServer}/exceptionrules-privacy-friendly.txt`;
  const redirectLink = "https://adblockplus.org/redirect?link=";

  const modules = {};
  window.require = function(module)
  {
    return modules[module];
  };

  modules.utils = {
    Utils: {
      getDocLink(link)
      {
        return `${redirectLink}${encodeURIComponent(link)}`;
      },
      get appLocale()
      {
        return browser.i18n.getUILanguage();
      },
      get readingDirection()
      {
        return /^(?:ar|fa|he|ug|ur)\b/.test(this.appLocale) ? "rtl" : "ltr";
      }
    }
  };

  modules.prefs = {Prefs: new EventEmitter()};
  const prefs = {
    notifications_ignoredcategories: params.showNotificationUI ? ["*"] : [],
    notifications_showui: params.showNotificationUI,
    shouldShowBlockElementMenu: true,
    show_devtools_panel: true,
    ui_warn_tracking: true,
    additional_subscriptions: params.additionalSubscriptions.split(","),
    subscriptions_exceptionsurl: acceptableAds,
    subscriptions_exceptionsurl_privacy: acceptableAdsPrivacyFriendly
  };
  for (const key of Object.keys(prefs))
  {
    Object.defineProperty(modules.prefs.Prefs, key, {
      get()
      {
        return prefs[key];
      },
      set(value)
      {
        prefs[key] = value;
        modules.prefs.Prefs.emit(key);
      }
    });
  }

  modules.notification = {
    Notification: {
      toggleIgnoreCategory(category)
      {
        const categories = prefs.notifications_ignoredcategories;
        const index = categories.indexOf(category);
        if (index == -1)
          categories.push(category);
        else
          categories.splice(index, 1);
        modules.prefs.Prefs.notifications_ignoredcategories = categories;
      }
    }
  };

  modules.notificationHelper = {
    getActiveNotification()
    {
    },
    shouldDisplay()
    {
      return true;
    }
  };

  const subscriptionDetails = {
    [easyListGermany]: {
      title: "EasyList Germany+EasyList",
      filters: ["-ad-banner.", "-ad-big.", "-ad-bottom-", "-ad-button-"],
      installed: true
    },
    [acceptableAds]: {
      title: "Allow non-intrusive advertising",
      installed: true
    },
    [acceptableAdsPrivacyFriendly]: {
      title: "Allow only nonintrusive ads that are privacy-friendly"
    },
    [`${subscriptionServer}/fanboy-social.txt`]: {
      title: "Fanboy's Social Blocking List",
      installed: true
    },
    [`${subscriptionServer}/abp-filters-anti-cv.txt`]: {
      title: "ABP Anti-Circumvention list",
      installed: true,
      disabled: false,
      recommended: "circumvention"
    },
    [`${subscriptionServer}/antiadblockfilters.txt`]: {
      title: "Adblock Warning Removal List",
      installed: true,
      disabled: true
    },
    "~user~786254": {
      installed: true
    }
  };

  function Subscription(url)
  {
    this.url = url;
    this._disabled = false;
    this._lastDownload = 1234;
    this.filters = [];
    this.homepage = "https://easylist.adblockplus.org/";
    this.downloadStatus = params.downloadStatus;

    const details = subscriptionDetails[this.url];
    if (details)
    {
      this.disabled = !!details.disabled;
      this.title = details.title || "";
      this.filters = this.filters.concat(details.filters);
    }
  }
  Subscription.prototype =
  {
    get disabled()
    {
      return this._disabled;
    },
    set disabled(value)
    {
      this._disabled = value;
      modules.filterNotifier.filterNotifier.emit("subscription.disabled", this);
    },
    get lastDownload()
    {
      return this._lastDownload;
    },
    set lastDownload(value)
    {
      this._lastDownload = value;
      modules.filterNotifier.filterNotifier.emit("subscription.lastDownload",
        this);
    }
  };
  Subscription.fromURL = function(url)
  {
    if (knownSubscriptions.has(url))
      return knownSubscriptions.get(url);

    if (/^https?:\/\//.test(url))
      return new modules.subscriptionClasses.Subscription(url);
    return new modules.subscriptionClasses.SpecialSubscription(url);
  };

  function SpecialSubscription(url)
  {
    this.url = url;
    this.disabled = false;
    this.filters = knownFilters.slice();
  }

  modules.subscriptionClasses = {
    Subscription,
    SpecialSubscription,
    DownloadableSubscription: Subscription
  };

  modules.filterStorage = {
    FilterStorage: {
      get subscriptions()
      {
        return Array.from(knownSubscriptions.values());
      },

      get knownSubscriptions()
      {
        return knownSubscriptions;
      },

      addSubscription(subscription)
      {
        const {fromURL} = Subscription;

        if (!knownSubscriptions.has(subscription.url))
        {
          knownSubscriptions.set(subscription.url, fromURL(subscription.url));
          modules.filterNotifier.filterNotifier.emit("subscription.added",
            subscription);
        }
      },

      removeSubscription(subscription)
      {
        if (knownSubscriptions.has(subscription.url))
        {
          knownSubscriptions.delete(subscription.url);
          modules.filterNotifier.filterNotifier.emit("subscription.removed",
            subscription);
        }
      },

      addFilter(filter)
      {
        for (const customFilter of customSubscription.filters)
        {
          if (customFilter.text == filter.text)
            return;
        }
        customSubscription.filters.push(filter);
        modules.filterNotifier.filterNotifier.emit("filter.added", filter);
      },

      removeFilter(filter)
      {
        for (let i = 0; i < customSubscription.filters.length; i++)
        {
          if (customSubscription.filters[i].text == filter.text)
          {
            customSubscription.filters.splice(i, 1);
            modules.filterNotifier.filterNotifier.emit("filter.removed",
              filter);
            return;
          }
        }
      }
    }
  };

  function Filter(text)
  {
    this.text = text;
    this.disabled = false;
  }
  Filter.fromText = (text) => new Filter(text);

  function ActiveFilter()
  {
  }

  function BlockingFilter()
  {
  }

  function RegExpFilter()
  {
  }
  RegExpFilter.typeMap = Object.create(null);

  modules.filterClasses = {
    ActiveFilter,
    BlockingFilter,
    Filter,
    RegExpFilter
  };

  modules.filterValidation =
  {
    parseFilter(text)
    {
      if (params.filterError)
        return {error: "Invalid filter"};
      return {filter: modules.filterClasses.Filter.fromText(text)};
    },
    parseFilters(text)
    {
      if (params.filterError)
        return {errors: ["Invalid filter"]};
      return {
        filters: text.split("\n")
          .filter((filter) => !!filter)
          .map(modules.filterClasses.Filter.fromText),
        errors: []
      };
    }
  };

  modules.synchronizer = {
    Synchronizer: {
      _downloading: false,
      execute(subscription, manual)
      {
        modules.synchronizer.Synchronizer._downloading = true;
        modules.filterNotifier.filterNotifier.emit(
          "subscription.downloading", subscription
        );
        setTimeout(() =>
        {
          modules.synchronizer.Synchronizer._downloading = false;
          subscription.lastDownload = Date.now() / 1000;
        }, 500);
      },
      isExecuting(url)
      {
        return modules.synchronizer.Synchronizer._downloading;
      }
    }
  };

  modules.matcher = {
    defaultMatcher: {
      matchesAny(url, requestType, docDomain, thirdParty)
      {
        const blocked = params.blockedURLs.split(",");
        if (blocked.indexOf(url) >= 0)
          return new modules.filterClasses.BlockingFilter();
        return null;
      }
    }
  };

  modules.filterNotifier = {
    filterNotifier: new EventEmitter()
  };

  modules.info = {
    platform: "gecko",
    platformVersion: "34.0",
    application: "firefox",
    applicationVersion: "34.0",
    addonName: "adblockplus",
    addonVersion: "2.6.7"
  };
  updateFromURL(modules.info);

  modules.subscriptionInit = {
    isDataCorrupted: () => params.dataCorrupted,
    isReinitialized: () => params.filterlistsReinitialized
  };

  modules.messaging = {
    port: new EventEmitter()
  };

  modules.options = {
    showOptions(callback)
    {
      if (!/\/(?:mobile|desktop)-options\.html\b/.test(top.location.href))
        window.open("desktop-options.html", "_blank");

      if (callback)
        callback();
    }
  };

  window.addEventListener("message", (event) =>
  {
    if (event.data.type != "message")
      return;
    const message = event.data.payload;
    const {messageId} = event.data;
    const sender = {
      page: new ext.Page(event.source)
    };

    const listeners = modules.messaging.port._listeners[message.type];
    if (!listeners)
      return;

    function reply(responseMessage)
    {
      event.source.postMessage({
        type: "response",
        messageId,
        payload: responseMessage
      }, "*");
    }

    for (const listener of listeners)
    {
      const response = listener(message, sender);
      if (response && typeof response.then == "function")
      {
        response.then(
          reply,
          (reason) =>
          {
            console.error(reason);
            reply(undefined);
          }
        );
      }
      else if (typeof response != "undefined")
      {
        reply(response);
      }
    }
  });

  const filters = [
    "@@||alternate.de^$document",
    "@@||der.postillion.com^$document",
    "@@||taz.de^$document",
    "@@||amazon.de^$document",
    "||biglemon.am/bg_poster/banner.jpg",
    "winfuture.de###header_logo_link",
    "###WerbungObenRechts10_GesamtDIV",
    "###WerbungObenRechts8_GesamtDIV",
    "###WerbungObenRechts9_GesamtDIV",
    "###WerbungUntenLinks4_GesamtDIV",
    "###WerbungUntenLinks7_GesamtDIV",
    "###WerbungUntenLinks8_GesamtDIV",
    "###WerbungUntenLinks9_GesamtDIV",
    "###Werbung_Sky",
    "###Werbung_Wide",
    "###__ligatus_placeholder__",
    "###ad-bereich1-08",
    "###ad-bereich1-superbanner",
    "###ad-bereich2-08",
    "###ad-bereich2-skyscrapper"
  ];
  const knownFilters = filters.map(modules.filterClasses.Filter.fromText);

  const knownSubscriptions = new Map();
  for (const url in subscriptionDetails)
  {
    if (!subscriptionDetails[url].installed)
      continue;

    knownSubscriptions.set(
      url,
      modules.subscriptionClasses.Subscription.fromURL(url)
    );
  }
  const customSubscription = knownSubscriptions.get("~user~786254");

  if (params.addSubscription)
  {
    // We don't know how long it will take for the page to fully load
    // so we'll post the message after one second
    setTimeout(() =>
    {
      window.postMessage({
        type: "message",
        payload: {
          title: "Custom subscription",
          url: "http://example.com/custom.txt",
          confirm: true,
          type: "subscriptions.add"
        }
      }, "*");
    }, 1000);
  }

  if (params.showPageOptions)
  {
    // We don't know how long it will take for the page to fully load
    // so we'll post the message after one second
    setTimeout(() =>
    {
      const host = "example.com";
      const isWhitelisted = customSubscription.filters
        .some((filter) => filter.text == `@@||${host}^$document`);
      window.postMessage({
        type: "message",
        payload: {
          type: "app.open",
          what: "options",
          action: "showPageOptions",
          args: [
            {
              host,
              whitelisted: isWhitelisted
            }
          ]
        }
      }, "*");
    }, 1000);
  }

  ext.devtools.onCreated.addListener((panel) =>
  {
    // blocked request
    panel.sendMessage({
      type: "add-record",
      request: {
        url: "http://adserver.example.com/ad_banner.png",
        type: "IMAGE",
        docDomain: "example.com"
      },
      filter: {
        text: "/ad_banner*$domain=example.com",
        whitelisted: false,
        userDefined: false,
        subscription: "EasyList"
      }
    });

    // whitelisted request
    panel.sendMessage({
      type: "add-record",
      request: {
        url: "http://example.com/looks_like_an_ad_but_isnt_one.html",
        type: "SUBDOCUMENT",
        docDomain: "example.com"
      },
      filter: {
        text: "@@||example.com/looks_like_an_ad_but_isnt_one.html",
        whitelisted: true,
        userDefined: false,
        subscription: "EasyList"
      }
    });

    // request with long URL and no filter matches
    panel.sendMessage({
      type: "add-record",
      request: {
        url: "https://this.url.has.a.long.domain/and_a_long_path_maybe_not_long_enough_so_i_keep_typing?there=are&a=couple&of=parameters&as=well&and=even&some=more",
        type: "XMLHTTPREQUEST",
        docDomain: "example.com"
      },
      filter: null
    });

    // matching element hiding filter
    panel.sendMessage({
      type: "add-record",
      request: {
        type: "ELEMHIDE",
        docDomain: "example.com"
      },
      filter: {
        text: "example.com##.ad_banner",
        whitelisted: false,
        userDefined: false,
        subscription: "EasyList"
      }
    });

    // user-defined filter
    panel.sendMessage({
      type: "add-record",
      request: {
        url: "http://example.com/some-annoying-popup",
        type: "POPUP",
        docDomain: "example.com"
      },
      filter: {
        text: "||example.com/some-annoying-popup$popup",
        whitelisted: false,
        userDefined: true,
        subscription: null
      }
    });

    // rewrite
    panel.sendMessage({
      type: "add-record",
      request: {
        url: "http://example.com/some-annoying-popup",
        type: "OTHER",
        docDomain: "example.com",
        rewrittenUrl: "http://example.com/some-annoying-popup?nopopup"
      },
      filter: {
        text: "/(example\\.com\\/some-annoying-popup\\)$/$rewrite=$1?nopopup",
        whitelisted: false,
        userDefined: true,
        subscription: null
      }
    });
  });
}());
