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

const allowedTags = new Set(["a", "em", "slot", "strong"]);
const reTag = /^(.*?)<([^/>\d]+)(\d)?>(.*?)<\/\2\3>(.*)$/;

function validate(string)
{
  const results = new ResultGroup("Validate tags");

  const match = reTag.exec(string);
  if (!match)
  {
    if (/<\S|\S>/.test(string))
    {
      results.push("Unexpected tag");
    }
    return results;
  }

  const [, before, name,, innerText, after] = match;

  if (!allowedTags.has(name))
  {
    results.push(`Unexpected tag name '${name}'`);
  }

  if (name === "slot" && innerText)
  {
    results.push("Slot tag must be empty");
  }

  if (/^\s|\s$/.test(innerText))
  {
    results.push(`Unexpected space inside tag '${name}'`);
  }

  results.push(validate(before));
  results.push(validate(innerText));
  results.push(validate(after));

  return results;
}
exports.validate = validate;
