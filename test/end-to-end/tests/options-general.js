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
