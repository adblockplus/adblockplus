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

/* globals process */

"use strict";

const fs = require("fs");
const path = require("path");
const csv = require("csv");
const {promisify} = require("util");
const execFile = promisify(require("child_process").execFile);
const csvParser = promisify(csv.parse);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const glob = promisify(require("glob").glob);

const localesDir = "locale";
const defaultLocale = "en_US";

const headers = ["Filename", "StringID", "Description", "Placeholders",
                 defaultLocale];
let outputFileName = "translations.csv";

/**
 * Export existing translation - files into CSV file
 */
function exportTranslations()
{
  glob(`${localesDir}/**/*.json`).then((filePaths) =>
  {
    // Reading all existing translations files
    return Promise.all(filePaths.map((filePath) => readJson(filePath)));
  }).then(csvFromJsonFileObjects);
}

/**
 * Creating Matrix which reflects output CSV file
 * @param  {Object[]} fileObjects - array of file objects created by readJson
 */
function csvFromJsonFileObjects(fileObjects)
{
  const locales = [];
  const fileNames = [];
  // Create Object tree from the Objects array, for easier search
  // ex.: {dektop-options.json: {en_US: {...}, {de: {...}, {ru: {...}}}
  const dataTreeObj = Object.create(null);
  for (const fileObject of fileObjects)
  {
    const {fileName, locale, strings} = fileObject;

    if (locale != defaultLocale && !locales.includes(locale))
      locales.push(locale);

    if ((!filesFilter.length || filesFilter.includes(fileName)) &&
         !fileNames.includes(fileName))
      fileNames.push(fileName);

    if (!(fileName in dataTreeObj))
      dataTreeObj[fileName] = Object.create(null);

    dataTreeObj[fileName][locale] = strings;
  }
  // Create two dimensional strings array that reflects CSV structure
  const csvArray = [headers.concat(locales)];
  for (const fileName of fileNames)
  {
    const strings = dataTreeObj[fileName][defaultLocale];
    // Skip files that doesn't exist for default language
    if (!strings)
      continue;

    for (const stringID of Object.keys(strings))
    {
      const fileObj = dataTreeObj[fileName];
      const {description, message, placeholders} = strings[stringID];
      const row = [fileName, stringID, description || "",
                   JSON.stringify(placeholders), message];

      for (const locale of locales)
      {
        const localeFileObj = fileObj[locale];
        const isTranslated = !!(localeFileObj && localeFileObj[stringID]);
        row.push(isTranslated ? localeFileObj[stringID].message : "");
      }
      csvArray.push(row);
    }
  }
  arrayToCsv(csvArray);
}

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
    const headLocales = dataMatrix.shift().slice(4);
    const dataTreeObj = {};
    for (const rowId in dataMatrix)
    {
      const row = dataMatrix[rowId];
      let [currentFilename, stringId, description, placeholder, ...messages] =
        row;
      if (!stringId)
        continue;

      stringId = stringId.trim();
      // Check if it's the filename row
      if (!dataTreeObj[currentFilename])
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
        if (!dataTreeObj[currentFilename][locale])
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
    writeJson(dataTreeObj);
  });
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

/**
 * This function currently relies on V8 to sort the object by keys
 * @param {Object} unordered - json object
 * @returns {Object}
 */
function sortJson(unordered)
{
  const ordered = {};
  for (const key of Object.keys(unordered).sort())
  {
    ordered[key] = unordered[key];
    if (unordered[key].placeholders)
      ordered[key].placeholders = sortJson(unordered[key].placeholders);

    ordered[key] = unordered[key];
  }
  return ordered;
}

/**
 * Convert two dimensional array to the CSV file
 * @param  {Object[]} csvArray - array to convert from
 */
function arrayToCsv(csvArray)
{
  csv.stringify(csvArray, (err, output) =>
  {
    writeFile(outputFileName, output, "utf8").then(() =>
    {
      // eslint-disable-next-line no-console
      console.log(`${outputFileName} is created`);
    }).catch((error) =>
    {
      console.error(error);
    });
  });
}

/**
 * Reads JSON file and assign filename and locale to it
 * @param {string} filePath - ex.: "locales/en_US/desktop-options.json"
 * @returns {Promise<Object>} resolves fileName, locale and strings of the
 *                            locale file
 */
function readJson(filePath)
{
  return readFile(filePath, "utf8").then((data) =>
  {
    const {dir, base} = path.parse(filePath);
    const locale = dir.split(path.sep).pop();
    const strings = JSON.parse(data);
    return {fileName: base, locale, strings};
  });
}

/**
 * Exit process and log error message
 * @param {String} error error message
 */
function exitProcess(error)
{
  console.error(error);
  process.exit(1);
}

// CLI
const helpText = `
About: Converts locale files between CSV and JSON formats
Usage: csv-export.js [option] [argument]
Options:
  -f [FILENAME]         Name of the files to be exported ex.: -f firstRun.json
                        option can be used multiple times.
                        If omitted all files are being exported

  -o [FILENAME]         Output filename ex.:
                        -f firstRun.json -o firstRun.csv
                        If omitted the output fileName is set to
                        translations.csv

  -i [FILENAME]         Import file path ex: -i issue-reporter.csv
`;

const argv = process.argv.slice(2);
let stopExportScript = false;
// Filter to be used export to the fileNames inside
const filesFilter = [];

for (let i = 0; i < argv.length; i++)
{
  switch (argv[i])
  {
    case "-h":
      console.log(helpText); // eslint-disable-line no-console
      stopExportScript = true;
      break;
    case "-f":
      if (!argv[i + 1])
      {
        exitProcess("Please specify the input filename");
      }
      filesFilter.push(argv[i + 1]);
      break;
    case "-o":
      if (!argv[i + 1])
      {
        exitProcess("Please specify the output filename");
      }
      outputFileName = argv[i + 1];
      break;
    case "-i":
      if (!argv[i + 1])
      {
        exitProcess("Please specify the import file");
      }
      const importFile = argv[i + 1];
      importTranslations(importFile);
      stopExportScript = true;
      break;
  }
}

if (!stopExportScript)
  exportTranslations(filesFilter);
