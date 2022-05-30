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
const path = require("path");

const {validate} = require("../../../build/locale-linter/validators/files");

describe("Locale Linter: File Validator", () =>
{
  const pathToData = path.resolve(__dirname, "./data");

  it("should approve a valid file", async() =>
  {
    const result = await validate(`${pathToData}/en_US/file.json`);

    expect(result.hasErrors()).to.be.false;
  });

  it("should reject a file with an invalid extension", async() =>
  {
    const result = await validate(`${pathToData}/en_US/file.xml`);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject a file path to a non-existent file", async() =>
  {
    const result = await validate(`${pathToData}/en_US/no-such-file.json`);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject a file path argument with an invalid locale", async() =>
  {
    const result = await validate(`${pathToData}/en-US/file.json`);

    expect(result.hasErrors()).to.be.true;
  });

  it("should reject a file that's not valid JSON", async() =>
  {
    const result = await validate(`${pathToData}/en_US/invalid.json`);

    expect(result.hasErrors()).to.be.true;
  });
});
