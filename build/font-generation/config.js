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

// Directory where the locales are located
const localesDir = "./locale";
// Folder for fonts generation
const outputDir = "./build/font-generation/output";
// Path for the font css file generation
const fontFile = `${outputDir}/font.css`;
// Input directory containing source fonts
const inputDir = "./build/font-generation/fonts";
// Common characters shared across fonts
const sharedCharacters = "@.,!?";

// determines which font to use for specific locales
const fontToLocalesMap = {
  "Cairo.ttf": ["ar"],
  "Athiti.ttf": ["th"],
  "SourceSansPro.ttf": ["af", "ast", "az", "be", "bg", "br", "bs", "ca", "cs",
                        "cy", "da", "de", "dsb", "el", "en_GB", "en_US", "eo",
                        "es", "es_AR", "es_CL", "es_MX", "et", "eu", "fi",
                        "fil", "fr", "fy", "gl", "hr", "hsb", "hu", "id", "is",
                        "it", "kab", "kk", "it", "lv", "mg", "mk", "ms", "nb",
                        "nl", "nn", "pl", "pt_BR", "pt_PT", "rm", "ro", "ru",
                        "sk", "sl", "sq", "sr", "sv", "sw", "tr", "uk", "uz",
                        "vi"]
};

module.exports = {localesDir, inputDir, outputDir, fontToLocalesMap, fontFile,
  sharedCharacters};
