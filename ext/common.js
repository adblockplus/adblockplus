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
    global.ext = {};

  function Page(source)
  {
    this._source = source;
  }
  Page.prototype =
  {
    sendMessage: function(message)
    {
      this._source.postMessage({
        type: "message",
        messageId: -1,
        payload: message
      }, "*");
    }
  };

  global.ext.Page = Page;

  /* Message passing */

  global.ext.onMessage =
  {
    addListener: function(listener)
    {
      listener._extWrapper = function(event)
      {
        if (event.data.type != "message")
          return;

        var message = event.data.payload;
        var messageId = event.data.messageId;
        var sender = {
          page: new Page(event.source)
        };
        var callback = function(message)
        {
          event.source.postMessage({
            type: "response",
            messageId: messageId,
            payload: message
          }, "*");
        };
        listener(message, sender, callback);
      };
      window.addEventListener("message", listener._extWrapper, false);
    },

    removeListener: function(listener)
    {
      if ("_extWrapper" in listener)
        window.removeEventListener("message", listener._extWrapper, false);
    }
  };

  /* I18n */

  var getLocaleCandidates = function(selectedLocale)
  {
    var candidates = [];
    var defaultLocale = "en-US";

    // e.g. "ja-jp-mac" -> "ja-JP", note that the part after the second
    // dash is dropped, since we only support language and region
    var parts = selectedLocale.split("-");
    var language = parts[0];
    var region = (parts[1] || "").toUpperCase();

    if (region)
      candidates.push(language + "-" + region);

    candidates.push(language);

    if (candidates.indexOf(defaultLocale) == -1)
      candidates.push(defaultLocale);

    return candidates;
  };

  var initCatalog = function(uiLocale)
  {
    var bidiDir = /^(ar|fa|he|ug|ur)(-|$)/.test(uiLocale) ? "rtl" : "ltr";
    var catalog = Object.create(null);

    catalog["@@ui_locale"] = [uiLocale.replace(/-/g, "_"), []];
    catalog["@@bidi_dir" ] = [bidiDir,  []];

    return catalog;
  };

  var selectedLocale = window.navigator.language;
  var match = /[?&]locale=([\w\-]+)/.exec(window.location.search);
  if (match)
    selectedLocale = match[1];

  var locales = getLocaleCandidates(selectedLocale);
  var catalog = initCatalog(locales[0]);
  var catalogFile = window.location.pathname.replace(/.*\//, "").replace(/\..*/, "") + ".json";

  var replacePlaceholder = function(text, placeholder, content)
  {
    return text.split("$" + placeholder + "$").join(content || "");
  };

  var parseMessage = function(rawMessage)
  {
    var text = rawMessage.message;
    var placeholders = [];

    for (var placeholder in rawMessage.placeholders)
    {
      var content = rawMessage.placeholders[placeholder].content;

      if (/^\$\d+$/.test(content))
        placeholders[parseInt(content.substr(1), 10) - 1] = placeholder;
      else
        text = replacePlaceholder(text, placeholder, content);
    }

    return [text, placeholders];
  };

  var readCatalog = function(locale, catalogFile)
  {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "locale/" + locale + "/" + catalogFile, false);
    xhr.overrideMimeType("text/plain");

    try
    {
      xhr.send();
    }
    catch (e)
    {
      return;
    }

    if (xhr.status != 200 && xhr.status != 0)
      return;

    var rawCatalog = JSON.parse(xhr.responseText);
    for (var msgId in rawCatalog)
    {
      if (!(msgId in catalog))
        catalog[msgId] = parseMessage(rawCatalog[msgId]);
    }
  };

  global.ext.i18n = {
    getMessage: function(msgId, substitutions)
    {
      while (true)
      {
        var message = catalog[msgId];
        if (message)
        {
          var text = message[0];
          var placeholders = message[1];

          if (!(substitutions instanceof Array))
            substitutions = [substitutions];

          for (var i = 0; i < placeholders.length; i++)
            text = replacePlaceholder(text, placeholders[i], substitutions[i]);

          return text;
        }

        if (locales.length == 0)
          return "";

        var locale = locales.shift();
        readCatalog(locale, "common.json");
        readCatalog(locale, catalogFile);
      }
    }
  };
})(this);
