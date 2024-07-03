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

const {afterSequence, beforeSequence} = require("../helpers.js");
const adFiltering = require("./smoke-main/ad-filtering.js");
const extension = require("./smoke-main/extension.js");
const installation = require("./smoke-main/installation.js");
const uninstallDefault = require("./smoke-main/uninstall-default.js");

describe("Smoke Tests - Main", function()
{
  before(async function()
  {
    this.test.parent.globalOrigin = await beforeSequence();
  });

  afterEach(async function()
  {
    if (!this.test.parent.lastTest)
      await afterSequence();
  });

  describe("Installation", installation);
  describe("Extension", extension);
  describe("Ad Filtering", adFiltering);
  describe("Uninstall with default settings", uninstallDefault);
});
