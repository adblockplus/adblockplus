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

/**
 * A list of words that need to be spelled exactly as listed here.
 *
 * @type string[]
 */
const importantWords = [
  "ABP",
  "Adblock Browser",
  "Adblock Plus",
  "Android",
  "Chrome",
  "Edge",
  "eyeo",
  "iOS",
  "Firefox",
  "GmbH",
  "Opera",
  "Microsoft"
];

/**
 * A map of exceptions to the strict spelling list.
 *
 * Keys are locales, values are objects that map an entry from the strict
 * spelling list to a list of allowed exceptions for the given locale.
 *
 * @type {object}
 * @example
 * {
 *   pl: {
 *     Opera: ["Opery"]
 *   }
 * }
 *
 */
const importantWordsExceptions = {
  pl: {
    Opera: ["Opery"]
  }
};

module.exports = {importantWords, importantWordsExceptions};
