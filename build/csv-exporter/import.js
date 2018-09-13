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
const csv = require("csv");
const {promisify} = require("util");
const csvParser = promisify(csv.parse);
const {localesDir, defaultLocale} = require("./config");
const fs = require("fs");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const path = require("path");

let csvDataTreeObj = null;

/**
 * Import strings from the CSV file
 * @param  {string} filePath - CSV file path to import from
 */
const importTranslations = (filePath) =>
{
  readFile(filePath, "utf8").then((fileObjects) =>
  {
    return csvParser(fileObjects);
  }).then((dataMatrix) =>
  {
    csvDataTreeObj = dataTreeObjFromDataMatrix(dataMatrix);
    for (const fileName of Object.keys(csvDataTreeObj))
    {
      for (const locale of Object.keys(csvDataTreeObj[fileName]))
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
          const strings = csvDataTreeObj[fileName][locale];
          writeJson(fileObjToDataTreeObj({fileName, locale, strings}));
        }
      }
    }
  });
};

function writeToExistingFile(fileObject)
{
  const {fileName, locale} = fileObject;
  const fileDataTreeObj = fileObjToDataTreeObj(fileObject);
  for (const stringId of Object.keys(csvDataTreeObj[fileName][locale]))
  {
    const fileString = fileDataTreeObj[fileName][locale][stringId];
    const csvString = csvDataTreeObj[fileName][locale][stringId];
    if (!fileString)
    {
      fileDataTreeObj[fileName][locale][stringId] = csvString;
    }
    else if (fileString.message !== csvString.message)
    {
      fileString.message = csvString.message;
    }
  }
  writeJson(fileDataTreeObj);
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

function dataTreeObjFromDataMatrix(dataMatrix)
{
  const headLocales = dataMatrix.shift().slice(5);
  const dataTreeObj = {};
  for (const rowId in dataMatrix)
  {
    const row = dataMatrix[rowId];
    let [/* type */, currentFilename, stringId, description, placeholder,
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
      if (placeholder)
        stringObj.placeholders = JSON.parse(placeholder);
    }
  }
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

module.exports = {importTranslations};
