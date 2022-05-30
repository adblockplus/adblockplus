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

const {promises: fs} = require("fs");
const path = require("path");

const {ResultGroup} = require("../common");
const {validate: validateStrings} = require("./strings");

const reLocale = /^[a-z]{1,3}(?:_(?:[A-Z]{2}|\d+))?$/;

/**
 * Validates the given i18n file.
 *
 * @param {string} filepath The path to the i18n file
 * @param {string[]} [importantWords] The list of strict spelling words
 * @param {object} [importantWordsExceptions] The map of strict spelling
 *   exceptions
 * @returns {Promise<ResultGroup>} The validation result
 */
async function validate(filepath, importantWords, importantWordsExceptions)
{
  const results = new ResultGroup(`Validate '${filepath}'`);

  const fileInfo = path.parse(filepath);

  if (fileInfo.ext !== ".json")
  {
    results.push("Expected file with .json extension");
    return results;
  }

  const pathParts = fileInfo.dir.split(path.sep);
  const locale = pathParts[pathParts.length - 1];
  if (!reLocale.test(locale))
  {
    results.push("Invalid locale");
    return results;
  }

  try
  {
    const content = await fs.readFile(filepath, "utf8");
    const stringInfos = JSON.parse(content);
    const stringResults = validateStrings(
      locale,
      stringInfos,
      importantWords,
      importantWordsExceptions
    );
    results.push(stringResults);
  }
  catch (ex)
  {
    results.push(ex);
  }

  return results;
}
exports.validate = validate;
