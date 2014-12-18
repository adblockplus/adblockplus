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
  if (!global.ext)
    global.ext = {};

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

  var listenerFilter = null;

  global.ext.backgroundPage = {
    sendMessage: function(message, responseCallback)
    {
      var respond = function(response)
      {
        setTimeout(responseCallback.bind(responseCallback, response), 0);
      };

      var dispatchListenerNotification = function(action)
      {
        var match = /^subscription\.(.*)/.exec(action);
        if (match && listenerFilter && listenerFilter.indexOf(match[1]) >= 0)
        {
          global.ext.onMessage._dispatch({
            type: "subscriptions.listen",
            action: match[1],
            args: Array.prototype.slice.call(arguments, 1)
          });
        }
      };

      switch (message.type)
      {
        case "app.get":
          if (message.what == "issues")
          {
            var response = {seenDataCorruption: false, filterlistsReinitialized: false};
            updateFromURL(response);

            var info = {platform: "gecko", platformVersion: "34.0", application: "firefox", applicationVersion: "34.0"};
            updateFromURL(info);
            response.legacySafariVersion = (info.platform == "safari" && (
              parseInt(info.platformVersion, 10) < 6 ||  // beforeload breaks websites in Safari 5
              info.platformVersion == "6.1" ||           // extensions are broken in 6.1 and 7.0
              info.platformVersion == "7.0"));

            respond(response);
          }
          else if (message.what == "doclink")
            respond("https://adblockplus.org/redirect?link=" + encodeURIComponent(message.link));
          else
            respond(null);
          break;
        case "app.open":
          if (message.what == "options")
            window.open("http://example.com/options.html", "_blank");
          break;
        case "subscriptions.get":
          respond(subscriptions);
          break;
        case "filters.blocked":
          var params = {blockedURLs: ""};
          updateFromURL(params);
          var blocked = params.blockedURLs.split(",");
          respond(blocked.indexOf(message.url) >= 0);
          break;
        case "subscriptions.toggle":
          var index = subscriptions.indexOf(message.url);
          if (index >= 0)
          {
            subscriptions.splice(index, 1);
            dispatchListenerNotification("subscription.removed", message.url);
          }
          else
          {
            subscriptions.push(message.url);
            dispatchListenerNotification("subscription.added", message.url);
          }
          break;
        case "subscriptions.listen":
          listenerFilter = message.filter;
          break;
      }
    }
  };

  var EventTarget = function(cancelable)
  {
    this._listeners = [];
    this._cancelable = cancelable;
  };
  EventTarget.prototype = {
    addListener: function(listener)
    {
      if (this._listeners.indexOf(listener) == -1)
        this._listeners.push(listener);
    },
    removeListener: function(listener)
    {
      var idx = this._listeners.indexOf(listener);
      if (idx != -1)
        this._listeners.splice(idx, 1);
    },
    _dispatch: function()
    {
      var result = null;

      for (var i = 0; i < this._listeners.length; i++)
      {
        result = this._listeners[i].apply(null, arguments);

        if (this._cancelable && result === false)
          break;
      }

      return result;
    }
  };
  global.ext.onMessage = new EventTarget();
})(this);
