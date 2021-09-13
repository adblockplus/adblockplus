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

const {waitForExtension} = require("../helpers");
const {By, until, Key} = require("selenium-webdriver");
const {strictEqual} = require("assert");
let driver = null;

describe("Testing advanced tab", () =>
{
  before(async() =>
  {
    let origin = null;
    [driver, origin] = await waitForExtension();
    await driver.get(`${origin}/desktop-options.html#advanced`);
  });

  after(async() =>
  {
    await driver.quit();
  });

  it("Adding custom filter with 'Enter' key", async() =>
  {
    const filterText = "##.get-malware";
    const filterInputQuery = "#custom-filters io-filter-search input";
    const inputElem = await driver.findElement(By.css(filterInputQuery));
    await inputElem.sendKeys(filterText);
    await inputElem.sendKeys(Key.ENTER);

    const filterQuery = `io-filter-list [title='${filterText}']`;
    const filter = await driver.wait(until.elementLocated(By.css(filterQuery)),
                                     10000);
    strictEqual(await filter.getText(), filterText);
  });
});
