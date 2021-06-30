"use strict";

const {waitForExtension} = require("../helpers");
const {expect} = require("chai");
const FooterChunk = require("../page-objects/footer.chunk");
const dataLinks = require("../test-data/data-links");
let browser = null;

describe("test links", () =>
{
  before(async() =>
  {
    let origin = null;
    [browser, origin] = await waitForExtension();
    await browser.url(`${origin}/desktop-options.html`);
  });

  after(async() =>
  {
    await browser.deleteSession();
  });

  it("should open contribute page", async() =>
  {
    const footerChunk = new FooterChunk(browser);
    await footerChunk.clickContributeButton();
    await footerChunk.switchToContributeTab();
    expect(await footerChunk.getCurrentUrl()).to.equal(
      dataLinks.contribute_page_url);
  });
});
