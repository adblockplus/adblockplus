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

const {
  validate
} = require("../../../build/locale-linter/validators/placeholders");


describe("Locale Linter: Placeholder Validator", () =>
{
  const placeholderDefinition = {
    one: "",
    two: ""
  };

  it("should approve a string without placeholders", () =>
  {
    const result = validate("no placeholders here");

    expect(result.hasErrors()).to.be.false;
  });

  it("should approve a string w/o placeholders and empty defs", () =>
  {
    const result = validate("no placeholders here", {});

    expect(result.hasErrors()).to.be.false;
  });

  it("should approve a valid string / definition combination", () =>
  {
    const input = "some $one$ words $two$ here";
    const result = validate(input, placeholderDefinition);

    expect(result.hasErrors()).to.be.false;
  });

  it("should reject when a definition for a placeholder is missing", () =>
  {
    const input = "some $one$ words $two$ here $three$";
    const result = validate(input, placeholderDefinition);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject when a placeholder is missing", () =>
  {
    const input = "some $one$ words";
    const result = validate(input, placeholderDefinition);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject multiple unenclosed placeholders in input", () =>
  {
    const input = "some $one $two words";
    const result = validate(input, {});

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject `$#` style placeholders in input", () =>
  {
    const input = "some $1 $2 words";
    const result = validate(input, {});

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject invalid placeholder names", () =>
  {
    const input = "some $foo-bar$ words";
    const defs = {"foo-bar": ""};
    const result = validate(input, defs);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject placeholder and definition mismatch names", () =>
  {
    const input = "some $one$ words";
    const defs = {two: ""};
    const result = validate(input, defs);

    expect(result.hasErrors()).to.be.true;
  });
});
