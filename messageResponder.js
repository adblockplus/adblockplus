/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-2016 Eyeo GmbH
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

(function(global)
{
  if (!global.ext)
    global.ext = require("ext_background");

  var port = require("messaging").port;
  var Prefs = require("prefs").Prefs;
  var Utils = require("utils").Utils;
  var FilterStorage = require("filterStorage").FilterStorage;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var defaultMatcher = require("matcher").defaultMatcher;
  var ElemHideEmulation = require("elemHideEmulation").ElemHideEmulation;
  var NotificationStorage = require("notification").Notification;

  var filterClasses = require("filterClasses");
  var Filter = filterClasses.Filter;
  var BlockingFilter = filterClasses.BlockingFilter;
  var RegExpFilter = filterClasses.RegExpFilter;
  var Synchronizer = require("synchronizer").Synchronizer;

  var info = require("info");
  var subscriptionClasses = require("subscriptionClasses");
  var Subscription = subscriptionClasses.Subscription;
  var DownloadableSubscription = subscriptionClasses.DownloadableSubscription;
  var SpecialSubscription = subscriptionClasses.SpecialSubscription;

  // Some modules doesn't exist on Firefox. Moreover,
  // require() throws an exception on Firefox in that case.
  // However, try/catch causes the whole function to to be
  // deoptimized on V8. So we wrap it into another function.
  function tryRequire(module)
  {
    try
    {
      return require(module);
    }
    catch (e)
    {
      return null;
    }
  }

  function convertObject(keys, obj)
  {
    var result = {};
    for (var i = 0; i < keys.length; i++)
    {
      var key = keys[i];
      if (key in obj)
        result[key] = obj[key];
    }
    return result;
  }

  function convertSubscription(subscription)
  {
    var obj = convertObject(["disabled", "downloadStatus", "homepage",
                             "lastDownload", "title", "url"], subscription);
    obj.isDownloading = Synchronizer.isExecuting(subscription.url);
    return obj;
  }

  var convertFilter = convertObject.bind(null, ["text"]);

  var changeListeners = new global.ext.PageMap();
  var listenedPreferences = Object.create(null);
  var listenedFilterChanges = Object.create(null);
  var messageTypes = {
    "app": "app.respond",
    "filter": "filters.respond",
    "pref": "prefs.respond",
    "subscription": "subscriptions.respond"
  };

  function sendMessage(type, action)
  {
    var pages = changeListeners.keys();
    if (pages.length == 0)
      return;

    var args = [];
    for (var i = 2; i < arguments.length; i++)
    {
      var arg = arguments[i];
      if (arg instanceof Subscription)
        args.push(convertSubscription(arg));
      else if (arg instanceof Filter)
        args.push(convertFilter(arg));
      else
        args.push(arg);
    }

    for (var j = 0; j < pages.length; j++)
    {
      var page = pages[j];
      var filters = changeListeners.get(page);
      var actions = filters[type];
      if (actions && actions.indexOf(action) != -1)
      {
        page.sendMessage({
          type: messageTypes[type],
          action: action,
          args: args
        });
      }
    }
  }

  function addFilterListeners(type, actions)
  {
    actions.forEach(function(action)
    {
      var name;
      if (type == "filter" && action == "loaded")
        name = "load";
      else
        name = type + "." + action;

      if (!(name in listenedFilterChanges))
      {
        listenedFilterChanges[name] = null;
        FilterNotifier.on(name, function()
        {
          var args = [type, action];
          for (var i = 0; i < arguments.length; i++)
            args.push(arguments[i]);
          sendMessage.apply(null, args);
        });
      }
    });
  }

  function getListenerFilters(page)
  {
    var listenerFilters = changeListeners.get(page);
    if (!listenerFilters)
    {
      listenerFilters = Object.create(null);
      changeListeners.set(page, listenerFilters);
    }
    return listenerFilters;
  }

  port.on("app.get", (message, sender) =>
  {
    if (message.what == "issues")
    {
      var subscriptionInit = tryRequire("subscriptionInit");
      return {
        filterlistsReinitialized: subscriptionInit ? subscriptionInit.reinitialized : false,
        legacySafariVersion: (info.platform == "safari" && (
            Services.vc.compare(info.platformVersion, "6.0") < 0 ||   // beforeload breaks websites in Safari 5
            Services.vc.compare(info.platformVersion, "6.1") == 0 ||  // extensions are broken in 6.1 and 7.0
            Services.vc.compare(info.platformVersion, "7.0") == 0))
      };
    }

    if (message.what == "doclink")
      return Utils.getDocLink(message.link);

    if (message.what == "localeInfo")
    {
      var bidiDir;
      if ("chromeRegistry" in Utils)
        bidiDir = Utils.chromeRegistry.isLocaleRTL("adblockplus") ? "rtl" : "ltr";
      else
        bidiDir = ext.i18n.getMessage("@@bidi_dir");

      return {locale: Utils.appLocale, bidiDir: bidiDir};
    }

    if (message.what == "features")
    {
      return {
        devToolsPanel: info.platform == "chromium",
        safariContentBlocker: "safari" in global
            && "extension" in global.safari
            && "setContentBlocker" in global.safari.extension
      };
    }

    return info[message.what];
  });

  port.on("app.listen", (message, sender) =>
  {
    getListenerFilters(sender.page).app = message.filter;
  });

  port.on("app.open", (message, sender) =>
  {
    if (message.what == "options")
      ext.showOptions();
  });

  port.on("filters.add", (message, sender) =>
  {
    var result = require("filterValidation").parseFilter(message.text);
    var errors = [];
    if (result.error)
      errors.push(result.error.toString());
    else if (result.filter)
      FilterStorage.addFilter(result.filter);

    return errors;
  });

  port.on("filters.blocked", (message, sender) =>
  {
    var filter = defaultMatcher.matchesAny(message.url,
      RegExpFilter.typeMap[message.requestType], message.docDomain,
      message.thirdParty);

    return filter instanceof BlockingFilter;
  });

  port.on("filters.get", (message, sender) =>
  {
    if (message.what == "elemhideemulation")
    {
      var filters = [];
      var checkWhitelisted = require("whitelisting").checkWhitelisted;

      if (Prefs.enabled && !checkWhitelisted(sender.page, sender.frame,
                            RegExpFilter.typeMap.DOCUMENT |
                            RegExpFilter.typeMap.ELEMHIDE))
      {
        var hostname = sender.frame.url.hostname;
        filters = ElemHideEmulation.getRulesForDomain(hostname);
        filters = filters.map(function(filter)
        {
          return {
            selector: filter.selector,
            text: filter.text
          };
        });
      }
      return filters;
    }

    var subscription = Subscription.fromURL(message.subscriptionUrl);
    if (!subscription)
      return [];

    return subscription.filters.map(convertFilter);
  });

  port.on("filters.importRaw", (message, sender) =>
  {
    var result = require("filterValidation").parseFilters(message.text);
    var errors = [];
    for (var i = 0; i < result.errors.length; i++)
    {
      var error = result.errors[i];
      if (error.type != "unexpected-filter-list-header")
        errors.push(error.toString());
    }

    if (errors.length > 0)
      return errors;

    var seenFilter = Object.create(null);
    for (var i = 0; i < result.filters.length; i++)
    {
      var filter = result.filters[i];
      FilterStorage.addFilter(filter);
      seenFilter[filter.text] = null;
    }

    if (!message.removeExisting)
      return errors;

    for (var i = 0; i < FilterStorage.subscriptions.length; i++)
    {
      var subscription = FilterStorage.subscriptions[i];
      if (!(subscription instanceof SpecialSubscription))
        continue;

      for (var j = subscription.filters.length - 1; j >= 0; j--)
      {
        var filter = subscription.filters[j];
        if (/^@@\|\|([^\/:]+)\^\$document$/.test(filter.text))
          continue;

        if (!(filter.text in seenFilter))
          FilterStorage.removeFilter(filter);
      }
    }

    return errors;
  });

  port.on("filters.listen", (message, sender) =>
  {
    getListenerFilters(sender.page).filter = message.filter;
    addFilterListeners("filter", message.filter);
  });

  port.on("filters.remove", (message, sender) =>
  {
    var filter = Filter.fromText(message.text);
    var subscription = null;
    if (message.subscriptionUrl)
      subscription = Subscription.fromURL(message.subscriptionUrl);

    if (!subscription)
      FilterStorage.removeFilter(filter);
    else
      FilterStorage.removeFilter(filter, subscription, message.index);
  });

  port.on("prefs.get", (message, sender) =>
  {
    return Prefs[message.key];
  });

  port.on("prefs.listen", (message, sender) =>
  {
    getListenerFilters(sender.page).pref = message.filter;
    message.filter.forEach(function(preference)
    {
      if (!(preference in listenedPreferences))
      {
        listenedPreferences[preference] = null;
        Prefs.on(preference, function()
        {
          sendMessage("pref", preference, Prefs[preference]);
        });
      }
    });
  });

  port.on("prefs.toggle", (message, sender) =>
  {
    if (message.key == "notifications_ignoredcategories")
      NotificationStorage.toggleIgnoreCategory("*");
    else
      Prefs[message.key] = !Prefs[message.key];
  });

  port.on("subscriptions.add", (message, sender) =>
  {
    var subscription = Subscription.fromURL(message.url);
    if ("title" in message)
      subscription.title = message.title;
    if ("homepage" in message)
      subscription.homepage = message.homepage;

    if (message.confirm)
    {
      ext.showOptions(function()
      {
        sendMessage("app", "addSubscription", subscription);
      });
    }
    else
    {
      subscription.disabled = false;
      FilterStorage.addSubscription(subscription);

      if (subscription instanceof DownloadableSubscription && !subscription.lastDownload)
        Synchronizer.execute(subscription);
    }
  });

  port.on("subscriptions.get", (message, sender) =>
  {
    var subscriptions = FilterStorage.subscriptions.filter(function(s)
    {
      if (message.ignoreDisabled && s.disabled)
        return false;
      if (s instanceof DownloadableSubscription && message.downloadable)
        return true;
      if (s instanceof SpecialSubscription && message.special)
        return true;
      return false;
    });

    return subscriptions.map(convertSubscription);
  });

  port.on("subscriptions.listen", (message, sender) =>
  {
    getListenerFilters(sender.page).subscription = message.filter;
    addFilterListeners("subscription", message.filter);
  });

  port.on("subscriptions.remove", (message, sender) =>
  {
    var subscription = Subscription.fromURL(message.url);
    if (subscription.url in FilterStorage.knownSubscriptions)
      FilterStorage.removeSubscription(subscription);
  });

  port.on("subscriptions.toggle", (message, sender) =>
  {
    var subscription = Subscription.fromURL(message.url);
    if (subscription.url in FilterStorage.knownSubscriptions)
    {
      if (subscription.disabled || message.keepInstalled)
        subscription.disabled = !subscription.disabled;
      else
        FilterStorage.removeSubscription(subscription);
    }
    else
    {
      subscription.disabled = false;
      subscription.title = message.title;
      subscription.homepage = message.homepage;
      FilterStorage.addSubscription(subscription);
      if (!subscription.lastDownload)
        Synchronizer.execute(subscription);
    }
  });

  port.on("subscriptions.update", (message, sender) =>
  {
    var subscriptions = message.url ? [Subscription.fromURL(message.url)] :
                        FilterStorage.subscriptions;
    for (var i = 0; i < subscriptions.length; i++)
    {
      var subscription = subscriptions[i];
      if (subscription instanceof DownloadableSubscription)
        Synchronizer.execute(subscription, true);
    }
  });
})(this);
