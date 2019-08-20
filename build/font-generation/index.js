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
       noLangRuleFont, outputFontFile, sharedCharacters} = require("./config");
const {generateFontFace, defaultCss, generateLangRule} = require("./css");
const {promisify} = require("util");
const {ensureDir, cammelToSentence, getLastDir,
       errorHandler} = require("./utils");
const exec = promisify(require("child_process").exec);
const glob = promisify(require("glob").glob);

/**
 * Custom filter to use string "messages" and also static placeholders
 * @param {object} info stringId object
 * @returns {string} characters for unicode convertion
 */
function getText(info)
{
  let hardcodedPlaceholders = "";
  const {message, placeholders} = info;
  for (const key in placeholders)
  {
    const placeholder = placeholders[key];
    if ("content" in placeholder)
      hardcodedPlaceholders += placeholder.content.replace(/\$\d/g, "");
  }
  const caseInsensitive = message + hardcodedPlaceholders;
  return caseInsensitive.toLowerCase() + caseInsensitive.toUpperCase();
}

/**
 * Uses local-range(see: https://www.npmjs.com/package/local-range) to generate
 * unicode ranges.
 * @param {array} include locale directory names
 * @returns {string} unicode ranges
 */
function getUnicodeRange(include)
{
  const options = {
    chars: sharedCharacters,
    folder: path.resolve(localesDir),
    include, getText
  };
  return localRange.toSubsetRanges(options);
}

/**
 * Generate font using fontTools (see: https://github.com/fonttools/fonttools)
 * @param {string} inputFile directory with the font sources
 * @param {string} outputFile font generation directory path
 * @param {array} locales locale directory names
 * @returns {array} output file, unicode range and passed locales
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

  return Promise.all(fontGenerationPromises).then((generatedFonts) =>
  {
    let cssFile = defaultCss;
    const fontLocales = [];
    for (const [filePath, unicodeRange, locales] of generatedFonts)
    {
      const {name} = path.parse(filePath);
      const weight = getLastDir(filePath);
      const fontName = cammelToSentence(name);
      if (!fontLocales.some(fontLocale => fontLocale.fontName == fontName))
        fontLocales.push({fontName, locales});

      const url = path.relative(path.dirname(outputFontFile), filePath);
      cssFile += generateFontFace(fontName, weight, url, unicodeRange);
    }

    for (const {fontName, locales} of fontLocales)
    {
      if (fontName != noLangRuleFont)
        cssFile += generateLangRule(locales, fontName);
    }
    fs.writeFileSync(outputFontFile, cssFile);
    // eslint-disable-next-line no-console
    console.log(`${outputFontFile} is created`);
  });
}).catch(errorHandler);
