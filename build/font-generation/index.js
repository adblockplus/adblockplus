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

const localRange = require("local-range");
const fs = require("fs");
const path = require("path");
const {localesDir, inputDir, outputDir, fontToLocalesMap,
       fontFile} = require("./config");
const {generateFontFace, license, generateLangRule} = require("./css");
const {promisify} = require("util");
const {ensureDir, cammelToSentence, getLastDir} = require("./utils");
const exec = promisify(require("child_process").exec);
const glob = promisify(require("glob").glob);

/**
 * Uses local-range(see: https://www.npmjs.com/package/local-range) to generate
 * unicode ranges.
 * @param {Array} include locale directory names
 * @returns {String} unicode ranges
 */
function getUnicodeRange(include)
{
  const options = {
    folder: path.resolve(localesDir),
    include
  };
  return localRange.toSubsetRanges(options);
}

/**
 * Generate font using fontTools (see: https://github.com/fonttools/fonttools)
 * @param {String} inputFile directory with the font sources
 * @param {String} outputFile font generation directory path
 * @param {Array} locales locale directory names
 * @returns {Array} output file, unicode range and passed locales
 */
function generateFont(inputFile, outputFile, locales)
{
  return getUnicodeRange(locales).then((unicodeRange) =>
  {
    const {dir} = path.parse(outputFile);
    ensureDir(dir);
    const unicodes = `--unicodes=${unicodeRange}`;
    const flavor = "--flavor=woff2";
    const output = `--output-file=${outputFile}`;
    return exec(`pyftsubset ${inputFile} ${unicodes} ${flavor} ${output}`).
      then(() =>
      {
        // eslint-disable-next-line no-console
        console.log(`${outputFile} is generated`);
        return [outputFile, unicodeRange, locales];
      });
  });
}

glob(`${inputDir}/**/*.*`).then((fonts) =>
{
  ensureDir(outputDir);
  const fontGenerationPromises = [];
  for (const inputFile of fonts)
  {
    const {base, name} = path.parse(inputFile);
    const weight = getLastDir(inputFile);
    const outputFile = path.join(outputDir, weight, name + ".woff2");
    const locales = fontToLocalesMap[base];

    fontGenerationPromises.push(generateFont(inputFile, outputFile, locales));
  }

  Promise.all(fontGenerationPromises).then((generatedFonts) =>
  {
    let cssFile = license;
    const fontLocales = [];
    for (const [filePath, unicodeRange, locales] of generatedFonts)
    {
      const {name} = path.parse(filePath);
      const weight = getLastDir(filePath);
      const fontName = cammelToSentence(name);
      if (!fontLocales.some(fontLocale => fontLocale.fontName == fontName))
        fontLocales.push({fontName, locales});

      cssFile += generateFontFace(fontName, weight, filePath, unicodeRange);
    }

    for (const {fontName, locales} of fontLocales)
    {
      cssFile += generateLangRule(locales, fontName);
    }
    fs.writeFileSync(fontFile, cssFile);
    // eslint-disable-next-line no-console
    console.log(`${fontFile} is created`);
  });
}).catch(console.error);
