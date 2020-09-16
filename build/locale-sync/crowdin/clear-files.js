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
const {unlinkSync, readFileSync} = fs;
const {basename} = require("path");
const {promisify} = require("util");
const yaml = require("js-yaml");
const glob = promisify(require("glob").glob);
const {rmdir} = fs.promises;
const {defaultLocale} = require("../common/config");

async function removeTranslations(ignoreLocale, ignoreFiles)
{
  const files = await glob(`./locale/!(${ignoreLocale})/!(${ignoreFiles})`);
  files.forEach(unlinkSync);

  // Remove empty locale directories
  const localeFolders = await glob("./locale/*");
  for (const localeFolder of localeFolders)
  {
    rmdir(localeFolder).catch(() => "");
  }
}

const result = yaml.safeLoad(readFileSync("./crowdin.yml", "utf8"));
const {ignore} = result.files[0];
if (ignore)
{
  const ignoreFiles = ignore.map((file) => basename(file)).join("|");
  removeTranslations(defaultLocale, ignoreFiles);
}
