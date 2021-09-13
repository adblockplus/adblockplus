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
const {By} = require("selenium-webdriver");
const {ok} = require("assert");

let driver = null;

describe("Testing general tab", () =>
{
  before(async() =>
  {
    let origin = null;
    [driver, origin] = await waitForExtension();
    await driver.get(`${origin}/desktop-options.html`);
  });

  after(async() =>
  {
    await driver.quit();
  });

  it("Enabling 'Block additional tracking'", async() =>
  {
    const easyPrivacy = "https://easylist-downloads.adblockplus.org/easyprivacy.txt";
    const protection = "#recommend-protection-list-table";
    const checkbox = `${protection} [data-access='${easyPrivacy}'] button`;
    await driver.findElement(By.css(checkbox)).click();

    const warningElement = By.css("#tracking-warning");
    const trackingWarning = await driver.findElement(warningElement);
    ok(await trackingWarning.isDisplayed(), "Warns if 'Allow AA' selected");
  });
});
