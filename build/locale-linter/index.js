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

const path = require("path");

const {validate: validateFile} = require("./validators/files");
const {validate: validateStrings} = require("./validators/strings");

async function run()
{
  const filepaths = process.argv.slice(2);

  let hasError = false;

  for (let filepath of filepaths)
  {
    filepath = path.resolve(filepath);

    try
    {
      const locale = path.dirname(filepath)
        .split(path.sep)
        .pop();
      const stringInfos = await validateFile(filepath);
      validateStrings(locale, stringInfos);
    }
    catch (ex)
    {
      ex.message += `\nFailed to validate '${filepath}'`;
      console.error(ex);
      hasError = true;
    }
  }

  if (hasError)
  {
    process.exit(1);
  }
}

run();
