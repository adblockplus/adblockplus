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

const {importTranslations} = require("./import");
const {exportTranslations} = require("./export");

const argv = require("minimist")(process.argv.slice(2));
const helpText = `Missing arguments: check "Translations CSV exporter" section
in the README file for more details`;

if (argv.e)
{
  exportTranslations(argv.e);
}
else if (argv.i)
{
  importTranslations(argv.i);
}
else
{
  // eslint-disable-next-line no-console
  console.log(helpText);
}
