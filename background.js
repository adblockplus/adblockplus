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
      let listeners = this._listeners[name];
      if (listeners)
      {
        let idx = listeners.indexOf(listener);
        if (idx != -1)
          listeners.splice(idx, 1);
      }
    },
    emit(name, ...args)
    {
      let listeners = this._listeners[name];
      if (listeners)
      {
        for (let listener of listeners)
          listener(...args);
      }
    }
  };

  function updateFromURL(data)
  {
    if (window.location.search)
    {
      let params = window.location.search.substr(1).split("&");

      for (let param of params)
      {
        let parts = param.split("=", 2);
        if (parts.length == 2 && parts[0] in data)
          data[parts[0]] = decodeURIComponent(parts[1]);
      }
    }
  }

  let params = {
    blockedURLs: "",
    filterlistsReinitialized: false,
    addSubscription: false,
    filterError: false,
    downloadStatus: "synchronize_ok",
    showNotificationUI: false,
    showPageOptions: false
  };
  updateFromURL(params);

  let modules = {};
  window.require = function(module)
  {
    return modules[module];
  };

  modules.utils = {
    Utils: {
      getDocLink(link)
      {
        return "https://adblockplus.org/redirect?link=" + encodeURIComponent(link);
      },
      get appLocale()
      {
        return parent.ext.i18n.getMessage("@@ui_locale").replace(/_/g, "-");
      }
    }
  };

  modules.prefs = {Prefs: new EventEmitter()};
  let prefs = {
    notifications_ignoredcategories: (params.showNotificationUI) ? ["*"] : [],
    notifications_showui: params.showNotificationUI,
    shouldShowBlockElementMenu: true,
    show_devtools_panel: true,
    subscriptions_exceptionsurl: "https://easylist-downloads.adblockplus.org/exceptionrules.txt",
    subscriptions_exceptionsurl_privacy: "https://easylist-downloads.adblockplus.org/exceptionrules-privacy.txt"
  };
  for (let key of Object.keys(prefs))
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
        let categories = prefs.notifications_ignoredcategories;
        let index = categories.indexOf(category);
        if (index == -1)
          categories.push(category);
        else
          categories.splice(index, 1);
        modules.prefs.Prefs.notifications_ignoredcategories = categories;
      }
    }
  };

  let subscriptionServer = "https://easylist-downloads.adblockplus.org";
  let subscriptionDetails = {
    [`${subscriptionServer}/easylistgermany+easylist.txt`]: {
      title: "EasyList Germany+EasyList",
      installed: true
    },
    [`${subscriptionServer}/exceptionrules.txt`]: {
      title: "Allow non-intrusive advertising",
      installed: true
    },
    [`${subscriptionServer}/exceptionrules-privacy.txt`]: {
      title: "Allow only nonintrusive ads that are privacy-friendly"
    },
    [`${subscriptionServer}/fanboy-social.txt`]: {
      title: "Fanboy's Social Blocking List",
      installed: true
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
    this.homepage = "https://easylist.adblockplus.org/";
    this.downloadStatus = params.downloadStatus;

    let details = subscriptionDetails[this.url];
    if (details)
    {
      this.disabled = !!details.disabled;
      this.title = details.title || "";
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
      modules.filterNotifier.FilterNotifier.emit("subscription.disabled", this);
    },
    get lastDownload()
    {
      return this._lastDownload;
    },
    set lastDownload(value)
    {
      this._lastDownload = value;
      modules.filterNotifier.FilterNotifier.emit("subscription.lastDownload",
        this);
    }
  };
  Subscription.fromURL = function(url)
  {
    if (url in knownSubscriptions)
      return knownSubscriptions[url];

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
        let subscriptions = [];
        for (let url in modules.filterStorage.FilterStorage.knownSubscriptions)
        {
          subscriptions.push(
            modules.filterStorage.FilterStorage.knownSubscriptions[url]
          );
        }
        return subscriptions;
      },

      get knownSubscriptions()
      {
        return knownSubscriptions;
      },

      addSubscription(subscription)
      {
        let {fromURL} = Subscription;
        let {FilterStorage} = modules.filterStorage;

        if (!(subscription.url in FilterStorage.knownSubscriptions))
        {
          knownSubscriptions[subscription.url] = fromURL(subscription.url);
          modules.filterNotifier.FilterNotifier.emit("subscription.added",
            subscription);
        }
      },

      removeSubscription(subscription)
      {
        let {FilterStorage} = modules.filterStorage;

        if (subscription.url in FilterStorage.knownSubscriptions)
        {
          delete knownSubscriptions[subscription.url];
          modules.filterNotifier.FilterNotifier.emit("subscription.removed",
            subscription);
        }
      },

      addFilter(filter)
      {
        for (let customFilter of customSubscription.filters)
        {
          if (customFilter.text == filter.text)
            return;
        }
        customSubscription.filters.push(filter);
        modules.filterNotifier.FilterNotifier.emit("filter.added", filter);
      },

      removeFilter(filter)
      {
        for (let i = 0; i < customSubscription.filters.length; i++)
        {
          if (customSubscription.filters[i].text == filter.text)
          {
            customSubscription.filters.splice(i, 1);
            modules.filterNotifier.FilterNotifier.emit("filter.removed",
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

  function BlockingFilter()
  {
  }

  function RegExpFilter()
  {
  }
  RegExpFilter.typeMap = Object.create(null);

  modules.filterClasses = {
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
        modules.filterNotifier.FilterNotifier.emit(
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
        let blocked = params.blockedURLs.split(",");
        if (blocked.indexOf(url) >= 0)
          return new modules.filterClasses.BlockingFilter();
        return null;
      }
    }
  };

  modules.elemHideEmulation = {
    ElemHideEmulation: {}
  };

  modules.filterNotifier = {
    FilterNotifier: new EventEmitter()
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
    reinitialized: params.filterlistsReinitialized
  };

  modules.messaging = {
    port: new EventEmitter()
  };

  window.addEventListener("message", (event) =>
  {
    if (event.data.type != "message")
      return;
    let message = event.data.payload;
    let {messageId} = event.data;
    let sender = {
      page: new ext.Page(event.source)
    };

    let listeners = modules.messaging.port._listeners[message.type];
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

    for (let listener of listeners)
    {
      let response = listener(message, sender);
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

  window.Services = {
    vc: {
      compare(v1, v2)
      {
        return parseFloat(v1) - parseFloat(v2);
      }
    }
  };

  let filters = [
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
  let knownFilters = filters.map(modules.filterClasses.Filter.fromText);

  let knownSubscriptions = Object.create(null);
  for (let url in subscriptionDetails)
  {
    if (!subscriptionDetails[url].installed)
      continue;

    knownSubscriptions[url] =
      modules.subscriptionClasses.Subscription.fromURL(url);
  }
  let customSubscription = knownSubscriptions["~user~786254"];

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
      let host = "example.com";
      let isWhitelisted = customSubscription.filters
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
  });
}());
