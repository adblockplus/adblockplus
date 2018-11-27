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
const path = require("path");
const {promisify} = require("util");

const reLocale = /^[a-z]{1,3}(?:_(?:[A-Z]{2}|\d+))?$/;

const readFile = promisify(fs.readFile);

async function validate(filepath)
{
  const fileInfo = path.parse(filepath);

  if (fileInfo.ext !== ".json")
    throw new Error("Expected file with .json extension");

  const pathParts = fileInfo.dir.split(path.sep);
  const locale = pathParts[pathParts.length - 1];
  if (!reLocale.test(locale))
    throw new Error("Unexpected locale");

  const content = await readFile(filepath, "utf8");
  return JSON.parse(content);
}
exports.validate = validate;
