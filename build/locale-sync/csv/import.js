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

const csv = require("csv");
const fs = require("fs");
const {promisify} = require("util");

const {importFilesObjects} = require("../common/import");
const {localesDir, defaultLocale} = require("./config");

const readFile = promisify(fs.readFile);
const csvParser = promisify(csv.parse);

/**
 * Import strings from the CSV file
 * @param  {string} filePath - CSV file path to import from
 */
function importTranslations(filePath)
{
  readFile(filePath, "utf8").then((fileObjects) =>
  {
    return csvParser(fileObjects);
  }).then((dataMatrix) =>
  {
    const fileObjects = dataTreeObjFromDataMatrix(dataMatrix);
    importFilesObjects(fileObjects, localesDir, defaultLocale);
  });
}

function dataTreeObjFromDataMatrix(dataMatrix)
{
  const headLocales = dataMatrix.shift().slice(5);
  const dataTreeObj = {};
  for (const rowId in dataMatrix)
  {
    const row = dataMatrix[rowId];
    let [/* type */, currentFilename, stringId, description, placeholders,
        ...messages] = row;
    if (!stringId)
      continue;

    stringId = stringId.trim();
    // Check if it's the filename row
    if (!(currentFilename in dataTreeObj))
      dataTreeObj[currentFilename] = {};

    description = description.trim();
    for (let i = 0; i < headLocales.length; i++)
    {
      const locale = headLocales[i].trim();
      const message = messages[i].trim();
      if (!message)
        continue;

      // Create Object tree from the Objects array, for easier search
      // ex.: {dektop-options.json: {en_US: {...}, {de: {...}, {ru: {...}}}
      if (!(locale in dataTreeObj[currentFilename]))
        dataTreeObj[currentFilename][locale] = {};

      const localeObj = dataTreeObj[currentFilename][locale];
      localeObj[stringId] = {};
      const stringObj = localeObj[stringId];

      // We keep string descriptions only in default locale files
      if (locale == defaultLocale && description)
        stringObj.description = description;

      stringObj.message = message;
      if (placeholders)
        stringObj.placeholders = JSON.parse(placeholders);
    }
  }
  return dataTreeObj;
}


module.exports = {importTranslations};
