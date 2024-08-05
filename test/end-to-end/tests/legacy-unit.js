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

const assert = require("assert");

const {waitForExtension} = require("../helpers");
const TestPage = require("../page-objects/test.page");

let origin = null;

describe("Testing units", () =>
{
  before(async() =>
  {
    ({origin} = await waitForExtension());
    await browser.url(`${origin}/tests/index.html`);
  });

  it("Running unit tests", async() =>
  {
    const testPage = new TestPage(browser);
    await testPage.init();

    const failures = await testPage.getFailureCountText();
    const descriptions = await testPage.getFailureDescriptionsText();
    assert.ok(failures === "0", `${failures} test(s) failed\n${descriptions}`);

    const passes = await testPage.getSuccessCountText();
    assert.ok(parseInt(passes, 10) > 0, "No tests were executed");
  });
});
