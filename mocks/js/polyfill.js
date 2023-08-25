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

  const getLocaleCandidates = function(selectedLocale)
  {
    const candidates = [];
    const defaultLocale = "en_US";

    // e.g. "ja-jp-mac" -> "ja_JP", note that the part after the second
    // dash is dropped, since we only support language and region
    const parts = selectedLocale.split("-");
    const language = parts[0];
    const region = (parts[1] || "").toUpperCase();

    if (region)
      candidates.push(language + "_" + region);

    candidates.push(language);

    if (candidates.indexOf(defaultLocale) == -1)
      candidates.push(defaultLocale);

    return candidates;
  };

  const match = /[?&]locale=([\w-]+)/.exec(window.top.location.search);
  const selectedLocale = (match) ? match[1] : "en_US";

  const locales = getLocaleCandidates(selectedLocale);
  let localeIdxToLoad = 0;
  const catalog = Object.create(null);
  const catalogFile = window.location.pathname.replace(/.*\//, "")
    .replace(/\..*/, "") + ".json";

  const replacePlaceholder = function(text, placeholder, content)
  {
    return text.split("$" + placeholder + "$").join(content || "");
  };

  const parseMessage = function(rawMessage)
  {
    let text = rawMessage.message;
    const placeholders = [];

    for (const placeholder in rawMessage.placeholders)
    {
      const {content} = rawMessage.placeholders[placeholder];

      if (/^\$\d+$/.test(content))
        placeholders[parseInt(content.substr(1), 10) - 1] = placeholder;
      else
        text = replacePlaceholder(text, placeholder, content);
    }

    return [text, placeholders];
  };

  const readCatalog = function(locale, file)
  {
    const xhr = new XMLHttpRequest();
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

    const rawCatalog = JSON.parse(xhr.responseText);
    for (const msgId in rawCatalog)
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
        const message = catalog[msgId];
        if (message)
        {
          let text = message[0];
          const placeholders = message[1];

          if (!(substitutions instanceof Array))
            substitutions = [substitutions];

          for (let i = 0; i < placeholders.length; i++)
            text = replacePlaceholder(text, placeholders[i], substitutions[i]);

          return text;
        }

        if (localeIdxToLoad >= locales.length)
          return "";

        const locale = locales[localeIdxToLoad++];
        readCatalog(locale, "common.json");
        readCatalog(locale, "filter-validation.json");
        readCatalog(locale, "issue-reporter.json");
        readCatalog(locale, "popup.json");
        readCatalog(locale, "updates-latest.json");
        readCatalog(locale, catalogFile);
      }
    }
  };

  browser.contentSettings = {
    cookies: {
      get(details)
      {
        return Promise.resolve({setting: "allow"});
      }
    },
    javascript: {
      get(details)
      {
        return Promise.resolve({setting: "allow"});
      }
    }
  };

  browser.management = {
    getAll()
    {
      return Promise.resolve([
        {
          enabled: true,
          id: "cfhdojbkjhnklbpkdaibdccddilifddb",
          name: "Adblock Plus",
          type: "extension",
          version: "3.4"
        }
      ]);
    }
  };

  browser.devtools = {
    panels: {
      openResource: (url) => window.open(url)
    },

    inspectedWindow: {
      reload: () => location.reload()
    }
  };
}());
