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
const {promisify} = require("util");
const glob = promisify(require("glob").glob);

const {getSourceStringFileDiffs} = require("../common/diff");
const {readJson} = require("../common/utils");
const {
  addedLabel,
  defaultLocale,
  headers,
  localesDir,
  modifiedLabel,
  outputFileName
} = require("./config");
const {arrayToCsv} = require("./utils");

/**
 * Export Translations since specific commit
 * @param  {String} commitHash - Older commit hash
 */
const exportTranslations = (commitHash) =>
{
  const dataTreeObj = Object.create(null);
  getSourceStringFileDiffs(commitHash).then((sourceFileDiffs) =>
  {
    for (const sourceFileDiff of sourceFileDiffs)
    {
      const {fileName, added, modified} = sourceFileDiff;
      dataTreeObj[fileName] = {added, modified, locales: {}};
    }
    const fileNames = sourceFileDiffs.map((item) => item.fileName);
    const filesPattern = `+(${fileNames.join("|")})`;
    const noSource = {ignore:
                      [`${localesDir}/${defaultLocale}/${filesPattern}`]};
    glob(`${localesDir}/**/${filesPattern}`, noSource).then((filePaths) =>
    {
      // Reading all existing translations files
      return Promise.all(filePaths.map((filePath) => readJson(filePath)));
    }).then((fileObjects) =>
    {
      for (const fileObject of fileObjects)
      {
        const {fileName, locale, strings} = fileObject; // test
        dataTreeObj[fileName]["locales"][locale] = strings;
      }
      const noDefaultLocale = {ignore: [`${localesDir}/${defaultLocale}`]};
      return glob(`${localesDir}/*`, noDefaultLocale);
    }).then((localeFolders) =>
    {
      const locales = localeFolders.map((locale) => path.parse(locale).base);
      return matrixFromJsonFileObjects(dataTreeObj, locales);
    }).then((csvArray) =>
    {
      arrayToCsv(csvArray, outputFileName).then(() =>
      {
        // eslint-disable-next-line no-console
        console.log(`${outputFileName} is created`);
      }).catch((error) =>
      {
        console.error(error);
      });
    });
  });
};

/**
 * Creating Matrix which reflects output CSV file
 * @param  {Object[]} dataTreeObj - dataTreeObj
 * @param  {String} locales - array of file objects created by readJson
 * @return {Array} Matrix reflecting CSV structure
 */
function matrixFromJsonFileObjects(dataTreeObj, locales)
{
  // Create two dimensional strings array that reflects CSV structure
  const csvArray = [headers.concat(locales)];
  const createFileStringRows = (strings, fileName, type) =>
  {
    for (const stringID of Object.keys(strings))
    {
      const fileObj = dataTreeObj[fileName];
      const {description, message, placeholders} = strings[stringID];
      const row = [type, fileName, stringID, description || "",
                   JSON.stringify(placeholders), message];

      for (const locale of locales)
      {
        const localeFileObj = fileObj["locales"][locale];
        const isTranslated = !!(localeFileObj && localeFileObj[stringID]);
        row.push(isTranslated ? localeFileObj[stringID].message : "");
      }
      csvArray.push(row);
    }
  };

  for (const fileName of Object.keys(dataTreeObj))
  {
    const addedStrings = dataTreeObj[fileName].added;
    const modifiedStrings = dataTreeObj[fileName].modified;
    createFileStringRows(addedStrings, fileName, addedLabel);
    createFileStringRows(modifiedStrings, fileName, modifiedLabel);
  }
  return csvArray;
}

module.exports = {exportTranslations};
