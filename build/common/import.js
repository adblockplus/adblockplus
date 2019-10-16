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

const {readJson, sortJson} = require("./utils");
const {promisify} = require("util");
const fs = require("fs");
const writeFile = promisify(fs.writeFile);
const path = require("path");

let localesDir = "";
let defaultLocale = "";
let newFileTreeOb = null;

/**
 * Import locales from files data object
 * @param {Object} filesDataObject ex.: {dektop-options.json: {en_US: {...}}}
 * @param {String} localesDirPath Path of the locales directory
 * @param {String} deafultLocaleName Default locale ex.: en_US
 */
function importFilesObjects(filesDataObject, localesDirPath, deafultLocaleName)
{
  newFileTreeOb = filesDataObject;
  localesDir = localesDirPath;
  defaultLocale = deafultLocaleName;
  for (const fileName of Object.keys(newFileTreeOb))
  {
    for (const locale of Object.keys(newFileTreeOb[fileName]))
    {
      if (locale === defaultLocale)
        continue;

      const translationFilePath = `${localesDir}/${locale}/${fileName}`;
      if (fs.existsSync(translationFilePath))
      {
        readJson(translationFilePath).then(writeToExistingFile);
      }
      else
      {
        const strings = newFileTreeOb[fileName][locale];
        writeJson(fileObjToDataTreeObj({fileName, locale, strings}));
      }
    }
  }
}

function writeToExistingFile(fileObject)
{
  const {fileName, locale} = fileObject;
  const existingFileTreeObj = fileObjToDataTreeObj(fileObject);
  for (const stringId of Object.keys(newFileTreeOb[fileName][locale]))
  {
    const existingString = existingFileTreeObj[fileName][locale][stringId];
    const newString = newFileTreeOb[fileName][locale][stringId];
    if (!existingString)
    {
      existingFileTreeObj[fileName][locale][stringId] = newString;
    }
    else if (existingString.message !== newString.message)
    {
      existingString.message = newString.message;
      if (!newString.placeholders)
        delete existingString.placeholders;
      else
        existingString.placeholders = newString.placeholders;
    }
  }
  writeJson(existingFileTreeObj);
}

/**
 * Convert the fileObject(ex.: created by `readFile` method) into dataTreeObj
 * dataTreeObj is a writable format
 * @param {Object} fileObject
 * @returns {Object} dataTreeObj
 */
function fileObjToDataTreeObj(fileObject)
{
  const dataTreeObj = {};
  dataTreeObj[fileObject.fileName] = {};
  dataTreeObj[fileObject.fileName][fileObject.locale] = fileObject.strings;
  return dataTreeObj;
}

/**
 * Write locale files according to dataTreeObj
 * @param  {Object} dataTreeObj - ex.:
 * {dektop-options.json: {en_US: {...}, {de: {...}, {ru: {...}}}
 */
function writeJson(dataTreeObj)
{
  for (const fileName in dataTreeObj)
  {
    for (const locale in dataTreeObj[fileName])
    {
      const filePath = path.join(localesDir, locale, fileName);
      const sortedJson = sortJson(dataTreeObj[fileName][locale]);
      let fileString = JSON.stringify(sortedJson, null, 2);

      // Newline at end of file to match Coding Style
      if (locale == defaultLocale)
        fileString += "\n";
      writeFile(filePath, fileString, "utf8").then(() =>
      {
        console.log(`Updated: ${filePath}`); // eslint-disable-line no-console
      }).catch((err) =>
      {
        console.error(err);
      });
    }
  }
}

module.exports = {importFilesObjects};
