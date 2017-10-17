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
  window.browser = {};

  /* I18n */

  let getLocaleCandidates = function(selectedLocale)
  {
    let candidates = [];
    let defaultLocale = "en_US";

    // e.g. "ja-jp-mac" -> "ja_JP", note that the part after the second
    // dash is dropped, since we only support language and region
    let parts = selectedLocale.split("-");
    let language = parts[0];
    let region = (parts[1] || "").toUpperCase();

    if (region)
      candidates.push(language + "_" + region);

    candidates.push(language);

    if (candidates.indexOf(defaultLocale) == -1)
      candidates.push(defaultLocale);

    return candidates;
  };

  let selectedLocale = window.navigator.language;
  let match = /[?&]locale=([\w-]+)/.exec(window.location.search);
  if (match)
    selectedLocale = match[1];

  let locales = getLocaleCandidates(selectedLocale);
  let catalog = Object.create(null);
  let catalogFile = window.location.pathname.replace(/.*\//, "")
    .replace(/\..*/, "") + ".json";

  let replacePlaceholder = function(text, placeholder, content)
  {
    return text.split("$" + placeholder + "$").join(content || "");
  };

  let parseMessage = function(rawMessage)
  {
    let text = rawMessage.message;
    let placeholders = [];

    for (let placeholder in rawMessage.placeholders)
    {
      let {content} = rawMessage.placeholders[placeholder];

      if (/^\$\d+$/.test(content))
        placeholders[parseInt(content.substr(1), 10) - 1] = placeholder;
      else
        text = replacePlaceholder(text, placeholder, content);
    }

    return [text, placeholders];
  };

  let readCatalog = function(locale, file)
  {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "locale/" + locale + "/" + file, false);
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

    let rawCatalog = JSON.parse(xhr.responseText);
    for (let msgId in rawCatalog)
    {
      if (!(msgId in catalog))
        catalog[msgId] = parseMessage(rawCatalog[msgId]);
    }
  };

  browser.i18n = {
    getUILanguage()
    {
      return locales[0].replace(/_/g, "-");
    },
    getMessage(msgId, substitutions)
    {
      while (true)
      {
        let message = catalog[msgId];
        if (message)
        {
          let text = message[0];
          let placeholders = message[1];

          if (!(substitutions instanceof Array))
            substitutions = [substitutions];

          for (let i = 0; i < placeholders.length; i++)
            text = replacePlaceholder(text, placeholders[i], substitutions[i]);

          return text;
        }

        if (locales.length == 0)
          return "";

        let locale = locales.shift();
        readCatalog(locale, "common.json");
        readCatalog(locale, catalogFile);
      }
    }
  };
}());
