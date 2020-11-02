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

const {ResultGroup, reStringId} = require("../common");
const {validate: validatePlaceholders} = require("./placeholders");
const {validate: validateTags} = require("./tags");
const {validate: validateWords} = require("./words");

function validate(locale, stringInfos)
{
  const results = new ResultGroup("Validate strings");

  for (const stringId in stringInfos)
  {
    const stringResults = new ResultGroup(
      `Validate string '${stringId}'`
    );

    if (!reStringId.test(stringId))
    {
      stringResults.push(`Invalid string ID '${stringId}'`);
    }

    const stringInfo = stringInfos[stringId];
    if (!("message" in stringInfo))
    {
      stringResults.push("Missing 'message' property");
    }

    if (/\n/.test(stringInfo.message))
    {
      stringResults.push("Unexpected newline character");
    }

    if (/^\s|\s$/.test(stringInfo.message))
    {
      stringResults.push("Unexpected leading/trailing space");
    }

    if (/\s{2,}/.test(stringInfo.message))
    {
      stringResults.push("Unexpected redundant space");
    }

    const placeholdersResults = validatePlaceholders(
      stringInfo.message,
      stringInfo.placeholders
    );
    stringResults.push(placeholdersResults);

    const tagsResults = validateTags(stringInfo.message);
    stringResults.push(tagsResults);

    const wordsResults = validateWords(locale, stringInfo.message);
    stringResults.push(wordsResults);

    results.push(stringResults);
  }

  return results;
}
exports.validate = validate;
