"use strict";

const BasePage = require("./base.page");

class FooterChunk extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get contributeButton()
  {
    return this.browser.$(".button=Contribute");
  }

  async clickContributeButton()
  {
    await (await this.contributeButton).click();
  }

  async switchToContributeTab()
  {
    await (await this.switchToTab("Contribute to Adblock Plus"));
  }
}

module.exports = FooterChunk;
