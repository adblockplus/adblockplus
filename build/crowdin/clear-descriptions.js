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

const {promisify} = require("util");
const glob = promisify(require("glob").glob);
const readFile = promisify(require("fs").readFile);
const writeFile = promisify(require("fs").writeFile);
const {localesDir, defaultLocale} = require("./config");

glob(`${localesDir}/!(${defaultLocale})/**/*.json`).then((filePaths) =>
{
  filePaths.forEach(removeDescription);
});

async function removeDescription(filePath)
{
  const file = JSON.parse(await readFile(filePath));
  for (const stringId in file)
    delete file[stringId].description;

  await writeFile(filePath, JSON.stringify(file, null, 2), "utf8");
}
