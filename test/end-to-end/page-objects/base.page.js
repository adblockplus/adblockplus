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

  get contentIFrame()
  {
    return $("#content");
  }

  get mockLicensingServerText()
  {
    return $("body[contains(text()," +
    "'Mock licensing server is up and running')]");
  }

  get truckerIFrame()
  {
    return $("#slave-2-1");
  }

  async getABPOptionsTabId()
  {
    await this.switchToABPOptionsTab(true);
    const currentTab = await browser.executeAsyncScript(`
      function getTabID()
      {
        return new Promise((resolve, reject) =>
        {
          try
          {
            chrome.tabs.query({active: true,}, function (tabs)
            {
              resolve(tabs[0].id);})} catch (e) {reject(e);
            }
          })
        }
        async function returnID()
        {
          let responseTabID = await getTabID();
          return responseTabID;}
          var callback = arguments[arguments.length - 1];
          returnID().then((data)=> {callback(data)
        });`, []);
    return currentTab;
  }

  async getCurrentUrl()
  {
    return await browser.getUrl();
  }

  async getCurrentTitle()
  {
    return await browser.getTitle();
  }

  async getElementBySelector(selector)
  {
    return $(selector);
  }

  async goToABPOptions(origin)
  {
    await browser.url(`${origin}/desktop-options.html`);
  }

  async isElementDisplayed(selector, reverseOption = false, timeout = 10000)
  {
    return await this.waitForDisplayedNoError(
      this.getElementBySelector(selector), reverseOption, timeout);
  }

  async isMockLicensingServerTextDisplayed(reverseOption = false)
  {
    return await this.waitForDisplayedNoError(this.
      mockLicensingServerText, reverseOption, 45000);
  }

  async scrollIntoViewAndClick(element)
  {
    await (await element).waitForClickable({timeout: 3000});
    await (await element).scrollIntoView();
    return (await element).click();
  }

  async switchToTab(title, timeout = 3500)
  {
    let waitTime = 0;
    while (waitTime <= timeout)
    {
      try
      {
        await browser.switchWindow(title);
        break;
      }
      catch (Exception)
      {
        await browser.pause(200);
        waitTime += 200;
      }
    }
    if (waitTime >= timeout)
    {
      throw new Error("Could not switch to tab!");
    }
  }

  async switchToABPOptionsTab(noSwitchToFrame = false)
  {
    await this.switchToTab("Adblock Plus Options");
    if (noSwitchToFrame === false)
    {
      try
      {
        await browser.switchToFrame(await this.contentIFrame);
      }
      catch (Exception)
      {
      }
    }
  }

  async waitForDisplayedNoError(element,
                                reverseOption = false, timeoutMs = 5000)
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

  async waitForEnabledNoError(element,
                              reverseOption = false, timeoutMs = 5000)
  {
    try
    {
      return await (await element).
        waitForEnabled({reverse: reverseOption, timeout: timeoutMs});
    }
    catch (ElementNotVisibleException)
    {
      return false;
    }
  }

  async waitForEnabledThenClick(element, timeoutMs = 3000)
  {
    await (await element).waitForClickable({timeout: timeoutMs});
    await browser.pause(700);
    return (await element).click();
  }

  async waitForSelectedNoError(element,
                               reverse = false, timeoutMs = 5000)
  {
    let status;
    try
    {
      status = await (await element).
      waitUntil(async function()
      {
        if (reverse)
        {
          return await (await this.isSelected()) === false;
        }
        return await (await this.isSelected()) === true;
      }, {
        timeout: timeoutMs,
        timeoutMsg: "Timeout while waiting on condition."
      });
    }
    catch (error)
    {
      status = false;
    }
    return status;
  }


  async waitUntilAttributeValueIs(element, attribute,
                                  expectedValue, timeoutVal = 5000,
                                  reverse = false)
  {
    await (await element).waitForEnabled({timeout: 2000});
    let status;
    try
    {
      status = await (await element).
      waitUntil(async function()
      {
        if (reverse)
        {
          return await (await this.
          getAttribute(attribute)) !== expectedValue;
        }
        return await (await this.
        getAttribute(attribute)) === expectedValue;
      }, {
        timeout: timeoutVal,
        timeoutMsg: "Timeout while waiting on condition."
      });
    }
    catch (error)
    {
      status = false;
    }
    return status;
  }

  async waitUntilTextIs(element, text,
                        timeoutVal = 5000)
  {
    return await (await element).
    waitUntil(async function()
    {
      return await (await this.getText()) === text;
    }, {
      timeout: timeoutVal,
      timeoutMsg: "Timeout while waiting on condition."
    });
  }
}

module.exports = BasePage;
