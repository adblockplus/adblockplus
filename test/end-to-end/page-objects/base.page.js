"use strict";

class BasePage
{
  constructor(browser)
  {
    this.browser = browser;
  }

  async switchToTab(url)
  {
    await this.browser.pause(2000);
    await this.browser.switchWindow(url);
  }

  async getCurrentUrl()
  {
    return await this.browser.getUrl();
  }
}

module.exports = BasePage;
