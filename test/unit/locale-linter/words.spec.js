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

const {expect} = require("chai");
const {validate} = require("../../../build/locale-linter/validators/words");

const strictList = [
  "ExactSpellingRequired",
  "Important Word",
  "Foo"
];

const locale = "__locale__";

const exceptions = {
  [locale]: {
    ExactSpellingRequired: ["exactspellingrequired"]
  }
};


describe("Locale Linter: Word Validator", () =>
{
  it("should approve exact spelling", () =>
  {
    const input = "ExactSpellingRequired";
    const result = validate(null, input, strictList, {});

    expect(result.hasErrors()).to.be.false;
  });

  it("should reject wrong character in word", () =>
  {
    const input = "ExactSpollingRequired";
    const result = validate(null, input, strictList, {});

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject wrong lowercase character in word", () =>
  {
    const input = "ExactspellingRequired";
    const result = validate(null, input, strictList, {});

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject wrong uppercase character in word", () =>
  {
    const input = "ExactSpellingRequiRed";
    const result = validate(null, input, strictList, {});

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject multiple problems in word", () =>
  {
    const input = "ExactspellingRequiRed";
    const result = validate(null, input, strictList, {});

    expect(result.hasErrors()).to.be.true;
  });

  it("should approve word with locale-specific exception", () =>
  {
    const input = "exactspellingrequired";
    const result = validate(locale, input, strictList, exceptions);

    expect(result.hasErrors()).to.be.false;
  });

  it("should approve valid word with punctuation", () =>
  {
    const input = "ExactSpellingRequired,";
    const result = validate(null, input, strictList, {});

    expect(result.hasErrors()).to.be.false;
  });

  it("should reject invalid word with punctuation", () =>
  {
    const input = "ExactSpollingRequired,";
    const result = validate(null, input, strictList, {});

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject punctuation within important words", () =>
  {
    const input = "Important, Word";
    const result = validate(null, input, strictList, {});

    expect(result.hasErrors()).to.be.true;
  });
});
