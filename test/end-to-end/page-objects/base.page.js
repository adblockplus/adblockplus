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

class BasePage
{
  constructor(browser)
  {
    this.browser = browser;
  }

  async switchToTab(url, timeout = 10000)
  {
    // Wait for tabs number to increase
    let windowHandles = await this.browser.getWindowHandles();
    let currentOpenTabsNr = windowHandles.length;
    const previousOpenTabsNr = currentOpenTabsNr;
    let waitTime = 0;
    while ((currentOpenTabsNr != previousOpenTabsNr) && waitTime <= timeout)
    {
      windowHandles = await this.browser.getWindowHandles();
      currentOpenTabsNr = windowHandles.length;
      await this.browser.pause(200);
      waitTime += 200;
    }
    // Wait for tab title to load
    await this.browser.switchToWindow(windowHandles[currentOpenTabsNr - 1]);
    let done = false;
    let currentTabTitle = "";
    const re = new RegExp(url);
    waitTime = 0;
    while (!done && waitTime <= timeout)
    {
      currentTabTitle = await this.browser.getTitle();
      if (re.test(currentTabTitle))
      {
        done = true;
        await this.browser.pause(300);
      }
      await this.browser.pause(200);
      waitTime += 200;
    }
    await this.browser.switchWindow(url);
  }

  async getCurrentUrl()
  {
    return await this.browser.getUrl();
  }

  async waitForDisplayedNoError(element,
                                reverseOption = false, timeoutMs = 2000)
  {
    try
    {
      return await (await element).
      waitForDisplayed({reverse: reverseOption, timeout: timeoutMs});
    }
    catch (ElementNotVisibleException)
    {
      return false;
    }
  }

  async waitUntilIsSelected(element, expectedValue = "true",
                            timeoutVal = 3000)
  {
    return await (await element).
    waitUntil(async function()
    {
      return await (await this.
      getAttribute("aria-checked")) === expectedValue;
    }, {
      timeout: timeoutVal,
      timeoutMsg: "Timeout while waiting on condition."
    });
  }
}

module.exports = BasePage;
