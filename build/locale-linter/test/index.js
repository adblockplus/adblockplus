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

const path = require("path");

const {validate: validateFiles} = require("../validators/files");
const {validate: validatePlaceholders} = require("../validators/placeholders");
const {validate: validateStrings} = require("../validators/strings");
const {validate: validateTags} = require("../validators/tags");
const {validate: validateWords} = require("../validators/words");
const {ResultGroup} = require("../common");

const allAssertResults = new ResultGroup("Test locale linter");

async function assertError(fn, msg, expectedError, ...args)
{
  const assertResults = new ResultGroup(msg);

  let error = null;
  try
  {
    error = await fn(...args);
    if (!error.hasErrors())
    {
      error = null;
    }
  }
  catch (ex)
  {
    error = ex;
  }

  if ((expectedError && !error) || (!expectedError && error))
  {
    assertResults.push(error);
  }

  allAssertResults.push(assertResults);
}

function assertFiles(msg, expectedError, filepath)
{
  filepath = path.resolve(__dirname, filepath);
  assertError(validateFiles, msg, expectedError, filepath);
}

const assertPlaceholders = assertError.bind(null, validatePlaceholders);
const assertStrings = assertError.bind(null, validateStrings);
const assertTags = assertError.bind(null, validateTags);
const assertWords = assertError.bind(null, validateWords);

Promise.all([
  assertFiles("Valid file", false, "./data/en_US/file.json"),
  assertFiles("Invalid file extension", true, "./data/en_US/file.xml"),
  assertFiles("Missing file", true, "./data/en_US/missing.json"),
  assertFiles("Invalid locale", true, "./data/en-US/file.json"),
  assertFiles("Invalid JSON", true, "./data/en-US/invalid.json"),

  assertPlaceholders("No placeholders", false, "foo"),
  assertPlaceholders("No placeholders with empty definition", false, "foo", {}),
  assertPlaceholders("Valid placeholders", false, "abc $def$ ghi $jkl$ mno", {
    def: null,
    jkl: null
  }),
  assertPlaceholders("Numeric placeholders ignored", false, "$1"),
  assertPlaceholders("Invalid placeholder name", true, "$foo-bar$", {
    "foo-bar": null
  }),
  assertPlaceholders("Too many placeholders", true, "$foo$ $bar$", {foo: null}),
  assertPlaceholders("Too few placeholders", true, "$foo$", {
    foo: null,
    bar: null
  }),
  assertPlaceholders("Unexpected placeholder name", true, "$foo$", {bar: null}),

  assertStrings("No strings", false, null, {}),
  assertStrings("Valid strings", false, null, {
    foo: {message: "foo"},
    bar: {message: "bar"}
  }),
  assertStrings("Invalid string ID", true, null, {"foo-bar": {message: "foo"}}),
  assertStrings("Missing required properties", true, null, {foo: {}}),
  assertStrings("Invalid character in string", true, null, {
    foo: {message: "foo\nbar"}
  }),
  assertStrings("Leading space", true, null, {foo: {message: " foo"}}),
  assertStrings("Trailing space", true, null, {foo: {message: "foo "}}),
  assertStrings("Redundant space", true, null, {foo: {message: "foo  bar"}}),

  assertTags("Valid tags", false, "abc <a>def</a> ghi <a>jkl</a> mno"),
  assertTags("Valid tag with index", false, "<a0>foo</a0>"),
  assertTags("Invalid tag order", true, "</a>foo<a>"),
  assertTags("Invalid closing tag", true, "<a0>foo</a>"),
  assertTags("Invalid tag hierarchy", true, "<a>foo<strong>bar</a></strong>"),
  assertTags("Unknown tag name", true, "<b>foo</b>"),
  assertTags("Invalid slot tag syntax", true, "<slot>foo</slot>"),
  assertTags("Space after opening tag", true, "<a> foo</a>"),
  assertTags("Space before closing tag", true, "<a>foo </a>"),

  assertWords("Wrong character in word", true, null, "Adblick Plus"),
  assertWords("Lower-case character in word", true, null, "Adblock plus"),
  assertWords("Upper-case character in word", true, null, "AdBlock Plus"),
  assertWords("Multiple problems in word", true, null, "Andbock Plus"),
  assertWords("Ignore locale-specific exceptions", false, "pl", "Opery"),
  assertWords("Valid word with punctuation", false, null, "Adblock Plus,"),
  assertWords("Invalid word with punctuation", true, null, "Mircosoft,"),
  assertWords(
    "Invalid long word with punctuation", true,
    null, "Abdlock Plus,"
  ),
  assertWords("Invalid punctuation inside word", true, null, "Adblock, Plus")
])
.then(() =>
{
  const output = allAssertResults.toString();
  if (allAssertResults.hasErrors())
  {
    console.error(output);
    process.exit(1);
  }
  else
  {
    /* eslint-disable-next-line no-console */
    console.log(output);
  }
})
.catch((err) =>
{
  console.error(err);
  process.exit(1);
});
