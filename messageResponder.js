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

  var Prefs = require("prefs").Prefs;
  var Utils = require("utils").Utils;
  var FilterStorage = require("filterStorage").FilterStorage;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var defaultMatcher = require("matcher").defaultMatcher;
  var CSSRules = require("cssRules").CSSRules;
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

  function convertObject(keys, obj)
  {
    var result = {};
    for (var i = 0; i < keys.length; i++)
      result[keys[i]] = obj[keys[i]];
    return result;
  }

  var convertSubscription = convertObject.bind(null, ["disabled",
    "downloadStatus", "homepage", "lastDownload", "title", "url"]);
  var convertFilter = convertObject.bind(null, ["text"]);

  var changeListeners = null;
  var messageTypes = {
    "app": "app.listen",
    "filter": "filters.listen",
    "pref": "prefs.listen",
    "subscription": "subscriptions.listen"
  };

  function sendMessage(type, action, args, page)
  {
    var pages = page ? [page] : changeListeners.keys();
    for (var i = 0; i < pages.length; i++)
    {
      var filters = changeListeners.get(pages[i]);
      if (filters[type] && filters[type].indexOf(action) >= 0)
      {
        pages[i].sendMessage({
          type:  messageTypes[type],
          action: action,
          args: args
        });
      }
    }
  }

  function onFilterChange(action)
  {
    if (action == "load")
      action = "filter.loaded";

    var parts = action.split(".", 2);
    var type;
    if (parts.length == 1)
    {
      type = "app";
      action = parts[0];
    }
    else
    {
      type = parts[0];
      action = parts[1];
    }

    if (!messageTypes.hasOwnProperty(type))
      return;

    var args = Array.prototype.slice.call(arguments, 1).map(function(arg)
    {
      if (arg instanceof Subscription)
        return convertSubscription(arg);
      else if (arg instanceof Filter)
        return convertFilter(arg);
      else
        return arg;
    });
    sendMessage(type, action, args);
  }

  function onPrefChange(name)
  {
    sendMessage("pref", name, [Prefs[name]]);
  }

  global.ext.onMessage.addListener(function(message, sender, callback)
  {
    var listenerFilters = null;
    if (/\.listen$/.test(message.type))
    {
      if (!changeListeners)
      {
        changeListeners = new global.ext.PageMap();
        FilterNotifier.addListener(onFilterChange);
        Prefs.onChanged.addListener(onPrefChange);
      }

      listenerFilters = changeListeners.get(sender.page);
      if (!listenerFilters)
      {
        listenerFilters = Object.create(null);
        changeListeners.set(sender.page, listenerFilters);
      }
    }

    switch (message.type)
    {
      case "add-subscription":
        ext.showOptions(function()
        {
          var subscription = Subscription.fromURL(message.url);
          subscription.title = message.title;
          onFilterChange("addSubscription", subscription);
        });
        break;
      case "app.get":
        if (message.what == "issues")
        {
          var subscriptionInit;
          try
          {
            subscriptionInit = require("subscriptionInit");
          }
          catch (e)
          {
            // Expected exception, this module doesn't exist on Firefox
          }

          callback({
            filterlistsReinitialized: subscriptionInit ? subscriptionInit.reinitialized : false,
            legacySafariVersion: (info.platform == "safari" && (
                Services.vc.compare(info.platformVersion, "6.0") < 0 ||   // beforeload breaks websites in Safari 5
                Services.vc.compare(info.platformVersion, "6.1") == 0 ||  // extensions are broken in 6.1 and 7.0
                Services.vc.compare(info.platformVersion, "7.0") == 0))
          });
        }
        else if (message.what == "doclink")
          callback(Utils.getDocLink(message.link));
        else if (message.what == "localeInfo")
        {
          var bidiDir;
          if ("chromeRegistry" in Utils)
            bidiDir = Utils.chromeRegistry.isLocaleRTL("adblockplus") ? "rtl" : "ltr";
          else
            bidiDir = ext.i18n.getMessage("@@bidi_dir");

          callback({locale: Utils.appLocale, bidiDir: bidiDir});
        }
        else if (message.what == "addonVersion")
        {
          callback(info.addonVersion);
        }
        else if (message.what == "features")
        {
          callback({
            devToolsPanel: info.platform == "chromium",
            safariContentBlocker: "safari" in global
                && "extension" in global.safari
                && "setContentBlocker" in global.safari.extension
          });
        }
        else
          callback(null);
        break;
      case "app.listen":
        if (message.filter)
          listenerFilters.app = message.filter;
        else
          delete listenerFilters.app;
        break;
      case "app.open":
        if (message.what == "options")
          ext.showOptions();
        break;
      case "filters.add":
        var result = require("filterValidation").parseFilter(message.text);
        var errors = [];
        if (result.error)
          errors.push(result.error.toString());
        else if (result.filter)
          FilterStorage.addFilter(result.filter);
        callback(errors);
        break;
      case "filters.blocked":
        var filter = defaultMatcher.matchesAny(message.url,
          RegExpFilter.typeMap[message.requestType], message.docDomain,
          message.thirdParty);
        callback(filter instanceof BlockingFilter);
        break;
      case "filters.get":
        if (message.what == "cssproperties")
        {
          var filters = [];
          var checkWhitelisted = require("whitelisting").checkWhitelisted;

          if (!checkWhitelisted(sender.page, sender.frame,
                                RegExpFilter.typeMap.DOCUMENT |
                                RegExpFilter.typeMap.ELEMHIDE))
          {
            filters = CSSRules.getRulesForDomain(sender.frame.url.hostname);
            filters = filters.map(function(filter)
            {
              return {
                prefix: filter.selectorPrefix,
                suffix: filter.selectorSuffix,
                regexp: filter.regexpString
              };
            });
          }
          callback(filters);
          break;
        }

        var subscription = Subscription.fromURL(message.subscriptionUrl);
        if (!subscription)
        {
          callback([]);
          break;
        }

        callback(subscription.filters.map(convertFilter));
        break;
      case "filters.importRaw":
        var result = require("filterValidation").parseFilters(message.text);
        var errors = [];
        for (var i = 0; i < result.errors.length; i++)
        {
          var error = result.errors[i];
          if (error.type != "unexpected-filter-list-header")
            errors.push(error.toString());
        }

        callback(errors);
        if (errors.length > 0)
          return;

        var seenFilter = Object.create(null);
        for (var i = 0; i < result.filters.length; i++)
        {
          var filter = result.filters[i];
          FilterStorage.addFilter(filter);
          seenFilter[filter.text] = null;
        }

        if (!message.removeExisting)
          return;

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
        break;
      case "filters.listen":
        if (message.filter)
          listenerFilters.filter = message.filter;
        else
          delete listenerFilters.filter;
        break;
      case "filters.remove":
        var filter = Filter.fromText(message.text);
        var subscription = null;
        if (message.subscriptionUrl)
          subscription = Subscription.fromURL(message.subscriptionUrl);

        if (!subscription)
          FilterStorage.removeFilter(filter);
        else
          FilterStorage.removeFilter(filter, subscription, message.index);
        break;
      case "prefs.get":
        callback(Prefs[message.key]);
        break;
      case "prefs.listen":
        if (message.filter)
          listenerFilters.pref = message.filter;
        else
          delete listenerFilters.pref;
        break;
      case "prefs.toggle":
        if (message.key == "notifications_ignoredcategories")
          NotificationStorage.toggleIgnoreCategory("*");
        else
          Prefs[message.key] = !Prefs[message.key];
        break;
      case "subscriptions.add":
        if (message.url in FilterStorage.knownSubscriptions)
          return;

        var subscription = Subscription.fromURL(message.url);
        if (!subscription)
          return;

        subscription.disabled = false;
        if ("title" in message)
          subscription.title = message.title;
        if ("homepage" in message)
          subscription.homepage = message.homepage;
        FilterStorage.addSubscription(subscription);

        if (subscription instanceof DownloadableSubscription && !subscription.lastDownload)
          Synchronizer.execute(subscription);
        break;
      case "subscriptions.get":
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
        callback(subscriptions.map(convertSubscription));
        break;
      case "subscriptions.listen":
        if (message.filter)
          listenerFilters.subscription = message.filter;
        else
          delete listenerFilters.subscription;
        break;
      case "subscriptions.remove":
        var subscription = Subscription.fromURL(message.url);
        if (subscription.url in FilterStorage.knownSubscriptions)
          FilterStorage.removeSubscription(subscription);
        break;
      case "subscriptions.toggle":
        var subscription = Subscription.fromURL(message.url);
        if (subscription.url in FilterStorage.knownSubscriptions)
        {
          if (subscription.disabled || message.keepInstalled)
          {
            subscription.disabled = !subscription.disabled;
            FilterNotifier.triggerListeners("subscription.disabled",
                                            subscription);
          }
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
        break;
      case "subscriptions.update":
        var subscriptions = message.url ? [Subscription.fromURL(message.url)] :
                            FilterStorage.subscriptions;
        for (var i = 0; i < subscriptions.length; i++)
        {
          var subscription = subscriptions[i];
          if (subscription instanceof DownloadableSubscription)
            Synchronizer.execute(subscription, true);
        }
        break;
      case "subscriptions.isDownloading":
        callback(Synchronizer.isExecuting(message.url));
        break;
    }
  });
})(this);
