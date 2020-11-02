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

const rePlaceholders = /\$([^$]+)\$/g;

function getPlaceholders(string)
{
  const placeholders = new Set();

  let placeholder;
  while (placeholder = rePlaceholders.exec(string))
  {
    placeholders.add(placeholder[1]);
  }

  return placeholders;
}

function validate(string, placeholderInfo)
{
  const results = new ResultGroup("Validate placeholders");

  const placeholders = getPlaceholders(string);
  const expected = Object.keys(placeholderInfo || {});

  if (expected.length < placeholders.size)
  {
    results.push("Unexpected placeholders");
    return results;
  }

  for (const placeholder of expected)
  {
    if (!reStringId.test(placeholder))
    {
      results.push(`Invalid placeholder name '${placeholder}'`);
      continue;
    }

    if (!placeholders.has(placeholder))
    {
      results.push("Missing placeholders");
    }
  }

  return results;
}
exports.validate = validate;
