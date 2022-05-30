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

const {validate} = require("../../../build/locale-linter/validators/tags");


describe("Locale Linter: Tag Validator", () =>
{
  it("should approve valid tags", () =>
  {
    const input = "abc <a>def</a> ghi <a>jkl</a> mno";
    const result = validate(input);

    expect(result.hasErrors()).to.be.false;
  });

  it("should approve valid tag with index", () =>
  {
    const input = "<a0>foo</a0>";
    const result = validate(input);

    expect(result.hasErrors()).to.be.false;
  });

  it("should reject invalid tag order", () =>
  {
    const input = "</a>foo<a>";
    const result = validate(input);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject an invalid closing tag", () =>
  {
    const input = "<a0>foo</a>";
    const result = validate(input);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject invalid tag hierarchy", () =>
  {
    const input = "<a>foo<strong>bar</a></strong>";
    const result = validate(input);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject unknown tag names", () =>
  {
    const input = "<b>foo</b>";
    const result = validate(input);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject invalid slot tag syntax", () =>
  {
    const input = "<slot>foo</slot>";
    const result = validate(input);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject whitespace after opening tag", () =>
  {
    const input = "<a> foo</a>";
    const result = validate(input);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject whitespace before closing tag", () =>
  {
    const input = "<a>foo </a>";
    const result = validate(input);

    expect(result.hasErrors()).to.be.true;
  });
});
