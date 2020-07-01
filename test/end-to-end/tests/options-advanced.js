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
