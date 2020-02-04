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

const sourceLanguage = "en_US";
const targetLanguages = ["ar_EG", "de_DE", "el_GR", "es_ES", "fr_FR", "hu_HU",
                         "it_IT", "ja_JP", "ko_KR", "nl_NL", "pl_PL", "pt_BR",
                         "ru_RU", "tr_TR", "zh_CN"];
const localesDir = "./locale";
const fs = require("fs");
const restApiUrl = "https://www.xtm-cloud.com/rest-api";
const customerId = 4419;
const workflowId = 2946;
const analysisTemplateId = "json";
const projectManagerId = 20;
const subjectMatterId = 24234;

/**
 * Maps XTM's locales to locales we use
 * @returns {Object}
 */
function generateXtmToLocalesMap()
{
  const xtmToLocalesMap = {};
  for (const locale of fs.readdirSync(localesDir))
  {
    const [language, country] = locale.split("_");
    if (country)
      xtmToLocalesMap[locale] = locale;
    else
      xtmToLocalesMap[`${language}_${language.toUpperCase()}`] = language;
  }
  // Hardcoding locales, for which country codes can't be extracted:
  xtmToLocalesMap["ar_EG"] = "ar";
  xtmToLocalesMap["el_GR"] = "el";
  xtmToLocalesMap["ja_JP"] = "ja";
  xtmToLocalesMap["ko_KR"] = "ko";
  return xtmToLocalesMap;
}

module.exports = {sourceLanguage, targetLanguages, localesDir, restApiUrl,
  customerId, workflowId, analysisTemplateId, projectManagerId, subjectMatterId,
  xtmToLocalesMap: generateXtmToLocalesMap()};
