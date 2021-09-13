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
const webdriver = require("selenium-webdriver");

const {waitForExtension} = require("../helpers");

const {By, until} = webdriver;

let driver = null;
let extensionHandle = null;
let origin = null;

/*
 * Standard-compliant polyfill for WebDriver#executeScript,
 * working around limitations of ChromeDriver <77,
 * enabling scripts to return a promise.
 */
async function executeScriptCompliant(script, ...args)
{
  const [isError, value] = await driver.executeAsyncScript(`
    let promise = (async function() { ${script} }).apply(null, arguments[0]);
    let callback = arguments[arguments.length - 1];
    promise.then(
      res => callback([false, res]),
      err => callback([true, err instanceof Error ? err.message : err])
    );`, args);

  if (isError)
    throw new Error(value);
  return value;
}

async function checkLastError(handle)
{
  await driver.switchTo().window(handle);

  const error = await executeScriptCompliant(
    "return browser.runtime.sendMessage({type: \"debug.getLastError\"});"
  );
  if (error != null)
    assert.fail("Unhandled error in background page: " + error);
}

describe("Testing units", () =>
{
  before(async() =>
  {
    [driver, origin, extensionHandle] = await waitForExtension();
    await driver.get(`${origin}/desktop-options.html#advanced`);
  });

  after(async() =>
  {
    await driver.quit();
  });

  it("Running unit tests", async() =>
  {
    await driver.navigate().to(origin + "/tests/index.html");

    await driver.wait(
      until.elementLocated(By.css("[data-progress=\"done\"]")),
      20000,
      "Unit tests execution did not finish"
    );

    const stats = await driver.findElement(By.id("mocha-stats"));
    const failures =
      await stats.findElement(By.css(".failures > em")).getText();
    const failureElements =
      await driver.findElements(By.css(".fail > h2, .fail .error"));
    const descriptions =
      (await Promise.all(failureElements.map(e => e.getText()))).join(", ");
    assert.ok(failures == "0", `${failures} test(s) failed\n${descriptions}`);

    const passes = await stats.findElement(By.css(".passes > em")).getText();
    assert.ok(parseInt(passes, 10) > 0, "No tests were executed");

    await checkLastError(extensionHandle);
  });
});
