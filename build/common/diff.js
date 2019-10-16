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
const exec = promisify(require("child_process").exec);
const glob = promisify(require("glob").glob);
const {localesDir, defaultLocale} = require("./config");
const {readJson} = require("./utils");

/**
 * Compares two fileObjects and returns their diff
 * @param {Object} oldFile fileObject created by `readJson`
 * @param {Object} newFile fileObject created by `readJson`
 * @returns {Object}
 */
function filesDiff(oldFile, newFile)
{
  const JSONdiff = {added: {}, modified: {}};
  JSONdiff.fileName = newFile.fileName;
  // This is not needed, but good for consistency
  JSONdiff.locale = newFile.locale;
  if (!oldFile)
  {
    // It's a new file
    JSONdiff.added = newFile.strings;
  }
  else
  {
    for (const stringId of Object.keys(newFile.strings))
    {
      if (!oldFile.strings[stringId])
      {
        JSONdiff.added[stringId] = newFile.strings[stringId];
      }
      else if (oldFile.strings[stringId].message !=
              newFile.strings[stringId].message)
      {
        JSONdiff.modified[stringId] = newFile.strings[stringId];
      }
      else
      {
        // No changes to the string
      }
    }
  }

  if (Object.keys(JSONdiff.added).length === 0 &&
      Object.keys(JSONdiff.modified).length === 0)
  {
    // No changes made to the file
    return null;
  }

  return JSONdiff;
}

function getFileObjectByFilename(fileObj, fileName)
{
  return fileObj.filter((file) => file.fileName == fileName)[0];
}

function getSourceStringFileObjects()
{
  return glob(`${localesDir}/${defaultLocale}/**/*.json`).then((filePaths) =>
  {
    return Promise.all(filePaths.map((filePath) => readJson(filePath)));
  });
}

/**
 * Get Array of source file diffs
 * @param {String} changeset hash of older comming
 * @returns {Array}
 */
const getSourceStringFileDiffs = (changeset) =>
{
  let currentSourceStringFileObjs = [];
  let oldSourceStringFileObjs = [];
  let currentHead = null;
  return getSourceStringFileObjects().then((filesObjects) =>
  {
    currentSourceStringFileObjs = filesObjects;
    return exec("git rev-parse --abbrev-ref HEAD");
  }).then((head) =>
  {
    currentHead = head.stdout;
    return exec(`git checkout ${changeset}`);
  }).then(getSourceStringFileObjects).then((filesObjects) =>
  {
    oldSourceStringFileObjs = filesObjects;
    return exec(`git checkout ${currentHead}`);
  }).then(() =>
  {
    const sourceFileDiffs = [];
    for (const currentFile of currentSourceStringFileObjs)
    {
      const oldFile = getFileObjectByFilename(oldSourceStringFileObjs,
                                              currentFile.fileName);
      const filesDifference = filesDiff(oldFile, currentFile);
      if (filesDifference)
        sourceFileDiffs.push(filesDifference);
    }
    return sourceFileDiffs;
  });
};

module.exports = {getSourceStringFileDiffs};
