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

const csvStringify = promisify(csv.stringify);
const writeFile = promisify(fs.writeFile);

/**
 * Convert two dimensional array to the CSV file
 * @param  {Object[]} csvArray - array to convert from
 * @param  {String} outputFileName - name of the output file
 * @returns {Promise}
 */
const arrayToCsv = (csvArray, outputFileName) =>
{
  return csvStringify(csvArray).then((output) =>
  {
    return writeFile(outputFileName, output, "utf8");
  });
};

module.exports = {arrayToCsv};
