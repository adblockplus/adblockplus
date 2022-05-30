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

const {validate} = require("../../../build/locale-linter/validators/strings");


describe("Locale Linter: String Validator", () =>
{
  it("should approve an empty object", () =>
  {
    const result = validate(null, {});

    expect(result.hasErrors()).to.be.false;
  });

  it("should approve valid object", () =>
  {
    const contents = {
      foo: {message: "foo"},
      bar: {message: "bar"}
    };
    const result = validate(null, contents);

    expect(result.hasErrors()).to.be.false;
  });

  it("should reject an invalid string id", () =>
  {
    const contents = {"foo-bar": {message: "foo"}};
    const result = validate(null, contents);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject when message property is missing", () =>
  {
    const invalid = {foo: {}};
    const result = validate(null, invalid);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject invalid characters in string", () =>
  {
    const contents = {foo: {message: "foo\nbar"}};
    const result = validate(null, contents);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject leading spaces", () =>
  {
    const contents = {foo: {message: " foo"}};
    const result = validate(null, contents);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject trailing spaces", () =>
  {
    const contents = {foo: {message: "foo "}};
    const result = validate(null, contents);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject redundant spaces", () =>
  {
    const contents = {foo: {message: "foo  bar"}};
    const result = validate(null, contents);

    expect(result.hasErrors()).to.be.true;
  });
});
