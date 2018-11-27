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

const allowedTags = new Set(["a", "slot", "strong"]);
const reTag = /^(.*?)<([^>\d]+)(\d)?>(.*?)<\/\2\3>(.*)$/;

function validate(string)
{
  const match = reTag.exec(string);
  if (!match)
  {
    if (/<\S|\S>/.test(string))
      throw new Error("Unexpected tag");

    return;
  }

  const [, before, name,, innerText, after] = match;

  if (!allowedTags.has(name))
    throw new Error(`Unexpected tag name '${name}'`);

  if (name === "slot" && innerText)
    throw new Error("Slot tag must be empty");

  validate(before);
  validate(innerText);
  validate(after);
}
exports.validate = validate;
