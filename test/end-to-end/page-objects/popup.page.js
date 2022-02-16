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

const BasePage = require("./base.page");

class PopupPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  async init(origin)
  {
    await this.browser.url(`${origin}/popup.html`);
  }

  get closeNotificationButton()
  {
    return $("//button[@text()='Close']");
  }

  get notificationMessage()
  {
    return $("#notification-message");
  }

  get stopShowingNotificationsButton()
  {
    return $("//button[@text()='Stop showing notifications']");
  }

  get yesButton()
  {
    return $("//p[@id='notification-message']/a");
  }

  async clickCloseNotificationButton()
  {
    await (await this.closeNotificationButton).click();
  }

  async clickStopShowingNotificationsButton()
  {
    await (await this.stopShowingNotificationsButton).click();
  }

  async clickYesButton()
  {
    await (await this.yesButton).click();
  }

  async getNotificationMessageText()
  {
    return await (await this.notificationMessage).getText();
  }

  async isNotificationMessageDisplayed()
  {
    return await (await this.notificationMessage).isDisplayed();
  }
}

module.exports = PopupPage;
