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

/**
 * Creates directory if one doesn't exists
 * @param {string} dir directory to ensure
 */
const ensureDir = (dir) =>
{
  // Ensure directory
  if (!fs.existsSync(dir))
    fs.mkdirSync(dir);
};

/**
 * Convert cammelCase text into Sentence Case
 * @param {string} text cammelCase text
 * @returns {string} Sentence Case text
 */
const cammelToSentence = (text) =>
{
  const result = text.replace(/([A-Z])/g, " $1").trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
};

/**
 * @param {string} filePath path to the file
 * @returns {string} Directory name where the file is located
 */
const getLastDir = (filePath) =>
{
  return path.basename(path.dirname(filePath));
};

module.exports = {ensureDir, cammelToSentence, getLastDir};
