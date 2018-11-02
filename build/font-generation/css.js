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

// Used for the css file generation
const license = `
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
`;

/**
 * Generates @font-face rule
 * @param {String} name value of font-family property
 * @param {String} weight value of weight property
 * @param {String} url value of src property's url()
 * @param {String} range value of unicode-range property
 * @returns {String}
 */
const generateFontFace = (name, weight, url, range) =>
{
  return `
@font-face
{
  font-family: "${name}";
  font-style: normal;
  font-weight: ${weight};
  /* local("Ø") forces using no local font called Source Sans Pro */
  src: local("Ø"), url("${url}")
    format("woff2");
  unicode-range: ${range};
}`;
};

/**
 * Generates :lang() rule
 * @param {Array} locales list of locales to be used by fonts
 * @param {String} fontFamily value of font-family property
 * @returns {String}
 */
const generateLangRule = (locales, fontFamily) =>
{
  const separator = ", ";
  const reducer = (acc, locale) => acc + `${separator}:lang(${locale})`;
  const selector = locales.reduce(reducer, "").replace(separator, "");
  return `
${selector}
{
  font-family: "${fontFamily}";
}`;
};

module.exports = {license, generateFontFace, generateLangRule};
