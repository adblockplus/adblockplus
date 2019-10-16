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

const fs = require("fs");
const {promisify} = require("util");
const readFile = promisify(fs.readFile);
const path = require("path");

/**
 * This function currently relies on V8 to sort the object by keys
 * @param {Object} unordered - json object
 * @returns {Object}
 */
const sortJson = (unordered) =>
{
  const ordered = {};
  for (const key of Object.keys(unordered).sort())
  {
    ordered[key] = unordered[key];
    if (unordered[key].placeholders)
      ordered[key].placeholders = sortJson(unordered[key].placeholders);

    ordered[key] = unordered[key];
  }
  return ordered;
};

/**
 * Reads JSON file and assign filename and locale to it
 * @param {string} filePath - ex.: "locales/en_US/desktop-options.json"
 * @returns {Promise<Object>} resolves fileName, locale and strings of the
 *                            locale file
 */
const readJson = (filePath) =>
{
  return readFile(filePath, "utf8").then((data) =>
  {
    const {dir, base} = path.parse(filePath);
    const locale = dir.split(path.sep).pop();
    const strings = JSON.parse(data);
    return {fileName: base, locale, strings};
  });
};

module.exports = {readJson, sortJson};
