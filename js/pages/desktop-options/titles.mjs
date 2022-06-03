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

const {getMessage} = browser.i18n;

let languageNames = new Map();

export function getRawItemTitle(item)
{
  return item.title || item.originalTitle || item.url || item.text;
}

function getLanguageItemTitle(item)
{
  const description = item.languages
    .map((langCode) => languageNames.get(langCode))
    // Remove duplicate language names
    .filter((langName, idx, arr) => arr.indexOf(langName) === idx)
    .reduce(
      (acc, langName, idx) =>
      {
        if (idx === 0)
          return langName;

        return getMessage("options_language_join", [acc, langName]);
      },
      ""
    );

  if (/\+EasyList$/.test(getRawItemTitle(item)))
    return `${description} + ${getMessage("options_english")}`;

  return description;
}

export function getPrettyItemTitle(item, includeRaw)
{
  const {recommended} = item;

  let description = null;
  if (recommended === "ads")
  {
    description = getLanguageItemTitle(item);
  }
  else
  {
    description = getMessage(`common_feature_${recommended}_title`);
  }

  if (!description)
    return getRawItemTitle(item);

  if (includeRaw)
    return `${getRawItemTitle(item)} (${description})`;

  return description;
}

export async function loadLanguageNames()
{
  const resp = await fetch("./data/locales.json");
  const localeData = await resp.json();
  languageNames = new Map(Object.entries(localeData.nativeNames));
}
