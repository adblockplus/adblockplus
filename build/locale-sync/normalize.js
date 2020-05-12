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
const {glob} = require("glob");
const {promisify} = require("util");

const {localesDir, defaultLocale} = require("./common/config");

const getFilepaths = promisify(glob);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Assigns object keys in alphabetical order to ensure a deterministic
// key order by relying on V8's JSON serialization logic
function sortObjectProperties(obj)
{
  const sorted = Object.create(null);

  const keys = Object.keys(obj).sort();
  for (const key of keys)
  {
    sorted[key] = obj[key];
  }

  return sorted;
}

function normalizeStrings(strings)
{
  for (const string of Object.values(strings))
  {
    // Translation files aren't supposed to include any descriptions
    if ("description" in string)
    {
      delete string.description;
    }

    if ("placeholders" in string)
    {
      string.placeholders = sortObjectProperties(string.placeholders);
    }
  }

  return sortObjectProperties(strings);
}

async function normalizeFile(filepath)
{
  const content = await readFile(filepath);
  const strings = JSON.parse(content);
  const normalizedStrings = normalizeStrings(strings);
  const normalizedContent = JSON.stringify(normalizedStrings, null, 2);

  await writeFile(filepath, normalizedContent, "utf8");
}

async function normalizeFiles()
{
  const filepaths = await getFilepaths(
    `./${localesDir}/!(${defaultLocale})/**/*.json`
  );
  await Promise.all(filepaths.map(normalizeFile));
}

normalizeFiles();
