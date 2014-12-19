/*
 * This file is part of Adblock Plus <http://adblockplus.org/>,
 * Copyright (C) 2006-2014 Eyeo GmbH
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
  function updateFromURL(data)
  {
    if (window.location.search)
    {
      var params = window.location.search.substr(1).split("&");
      for (var i = 0; i < params.length; i++)
      {
        var parts = params[i].split("=", 2);
        if (parts.length == 2 && parts[0] in data)
          data[parts[0]] = decodeURIComponent(parts[1]);
      }
    }
  }

  var subscriptions =[
    "https://easylist-downloads.adblockplus.org/easylistgermany+easylist.txt",
    "https://easylist-downloads.adblockplus.org/exceptionrules.txt",
    "https://easylist-downloads.adblockplus.org/fanboy-social.txt"
  ];

  global.Utils = {
    getDocLink: function(link)
    {
      return "https://adblockplus.org/redirect?link=" + encodeURIComponent(link);
    }
  };

  global.Subscription = function(url)
  {
    this.url = url;
    this.title = "Subscription " + url;
    this.disabled = false;
    this.lastDownload = 1234;
  };

  global.Subscription.fromURL = function(url)
  {
    return new global.Subscription(url);
  };

  global.DownloadableSubscription = global.Subscription;
  global.SpecialSubscription = function() {};

  global.FilterStorage = {
    get subscriptions()
    {
      return subscriptions.map(global.Subscription.fromURL);
    },

    get knownSubscriptions()
    {
      var result = {};
      for (var i = 0; i < subscriptions.length; i++)
        result[subscriptions[i]] = global.Subscription.fromURL(subscriptions[i]);
      return result;
    },

    addSubscription: function(subscription)
    {
      var index = subscriptions.indexOf(subscription.url);
      if (index < 0)
      {
        subscriptions.push(subscription.url);
        global.FilterNotifier.triggerListeners("subscription.added", subscription);
      }
    },

    removeSubscription: function(subscription)
    {
      var index = subscriptions.indexOf(subscription.url);
      if (index >= 0)
      {
        subscriptions.splice(index, 1);
        global.FilterNotifier.triggerListeners("subscription.removed", subscription);
      }
    }
  };

  global.BlockingFilter = function() {};

  global.defaultMatcher = {
    matchesAny: function(url, requestType, docDomain, thirdParty)
    {
      var params = {blockedURLs: ""};
      updateFromURL(params);
      var blocked = params.blockedURLs.split(",");
      if (blocked.indexOf(url) >= 0)
        return new global.BlockingFilter();
      else
        return null;
    }
  };

  var notifierListeners = [];
  global.FilterNotifier = {
    addListener: function(listener)
    {
      if (notifierListeners.indexOf(listener) < 0)
        notifierListeners.push(listener);
    },

    removeListener: function(listener)
    {
      var index = notifierListeners.indexOf(listener);
      if (index >= 0)
        notifierListeners.splice(index, 1);
    },

    triggerListeners: function()
    {
      var args = Array.prototype.slice.apply(arguments);
      var listeners = notifierListeners.slice();
      for (var i = 0; i < listeners.length; i++)
        listeners[i].apply(null, args);
    }
  };

  global.require = function(module)
  {
    if (module == "info")
    {
      var result = {
        platform: "gecko",
        platformVersion: "34.0",
        application: "firefox",
        applicationVersion: "34.0"
      };
      updateFromURL(result);
      return result;
    }
    else
      return undefined;
  }

  global.openOptions = function()
  {
    window.open("http://example.com/options.html", "_blank");
  };

  global.Services = {
    vc: {
      compare: function(v1, v2)
      {
        return parseFloat(v1) - parseFloat(v2);
      }
    }
  };

  var issues = {seenDataCorruption: false, filterlistsReinitialized: false};
  updateFromURL(issues);
  global.seenDataCorruption = issues.seenDataCorruption;
  global.filterlistsReinitialized = issues.filterlistsReinitialized;
})(this);
