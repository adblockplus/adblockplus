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
const {ResultGroup} = require("./common");
const {importantWords, importantWordsExceptions} = require("./dictionary");

async function run()
{
  const results = new ResultGroup("Validate translations");

  try
  {
    const filepaths = process.argv.slice(2);
    for (let filepath of filepaths)
    {
      filepath = path.resolve(filepath);

      const result = await validateFile(
        filepath,
        importantWords,
        importantWordsExceptions
      );
      results.push(result);
    }
  }
  catch (ex)
  {
    results.push(ex);
  }

  const output = results.toString();
  if (results.hasErrors())
  {
    console.error(output);
    process.exit(1);
  }
  else
  {
    /* eslint-disable-next-line no-console */
    console.log(output);
  }
}

run();
