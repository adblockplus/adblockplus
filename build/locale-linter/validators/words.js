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

const {ResultGroup} = require("../common");

const distanceCache = new Map();

// We're calculating the Levenshtein distance between two strings
// to determine how similar they are to each other
function getDistance(a, b)
{
  let cache = distanceCache.get(a);
  if (cache)
  {
    const cached = cache.get(b);
    if (typeof cached === "number")
      return cached;
  }

  if (a === "")
    return b.length;

  if (b === "")
    return a.length;

  const charDistance = (a[a.length - 1] === b[b.length - 1]) ? 0 : 1;
  const distance = Math.min(
    getDistance(a.slice(0, -1), b) + 1,
    getDistance(a, b.slice(0, -1)) + 1,
    getDistance(a.slice(0, -1), b.slice(0, -1)) + charDistance
  );

  if (!cache)
  {
    cache = new Map();
    distanceCache.set(a, cache);
  }
  cache.set(b, distance);

  return distance;
}

/**
 * Validates the given i18n string for the given locale.
 *
 * @param {string} locale The locale of the i18n string to validate
 * @param {string} string The i18n string to validate
 * @param {string[]} [importantWords=[]] The list of strict spelling words
 * @param {object} [exceptions={}] The map of strict spelling exceptions
 * @returns {ResultGroup} The validation result
 */
function validate(locale, string, importantWords = [], exceptions = {})
{
  const results = new ResultGroup("Validate words");
  const words = string.split(" ");

  for (let i = 0; i < words.length; i++)
  {
    for (const importantWord of importantWords)
    {
      // For short words, we're not searching for typos
      // in order to avoid false positives
      if (importantWord.length < 5)
        continue;

      let word = words[i];
      if (importantWord.includes(" "))
      {
        if (i + 1 >= words.length)
          continue;

        word = `${word} ${words[i + 1]}`;
      }

      // Trim any unrelated/non-latin characters around the word
      word = word.replace(/^\W+|\W+$/, "");

      // Ignore if word matches important word exactly
      if (word.includes(importantWord))
        continue;

      // Ignore if word is a locale-specific exception
      if (locale in exceptions &&
          importantWord in exceptions[locale] &&
          exceptions[locale][importantWord].includes(word))
        continue;

      const distance = getDistance(word, importantWord);
      if (distance === 1 ||
          (importantWord.length > 6 && distance === 2))
      {
        results.push(`Invalid word '${word}'`);
      }
    }
  }

  return results;
}
exports.validate = validate;
