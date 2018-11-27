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

const {reStringId} = require("../common");
const {validate: validatePlaceholders} = require("./placeholders");
const {validate: validateTags} = require("./tags");

function validate(stringInfos)
{
  for (const stringId in stringInfos)
  {
    try
    {
      if (!reStringId.test(stringId))
        throw new Error(`Unexpected string ID '${stringId}'`);

      const stringInfo = stringInfos[stringId];
      if (!("message" in stringInfo))
        throw new Error("Missing 'message' property");

      if (/\n/.test(stringInfo.message))
        throw new Error("Unexpected newline character");

      validatePlaceholders(stringInfo.message, stringInfo.placeholders);
      validateTags(stringInfo.message);
    }
    catch (ex)
    {
      ex.message += `\nFailed to validate string '${stringId}'`;
      throw ex;
    }
  }
}
exports.validate = validate;
