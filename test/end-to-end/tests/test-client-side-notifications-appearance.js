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

const {afterSequence, beforeSequence, globalRetriesNumber} =
  require("../helpers");
const {expect} = require("chai");
const PopupPage = require("../page-objects/popup.page");
const notificationScripts =
  require("../test-data/data-notifications-appearance").notificationScripts;
let globalOrigin;

describe("test client side notifications appearance", function()
{
  this.retries(globalRetriesNumber);

  beforeEach(async function()
  {
    globalOrigin = await beforeSequence();
  });

  afterEach(async function()
  {
    await afterSequence();
  });

  it("should display critical notification", async function()
  {
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin);
    await browser.executeScript(notificationScripts.criticalNotification, []);
    expect(await popupPage.
      getNotificationBorderColor()).to.equal("rgb(237, 30, 69)");
    expect(await popupPage.
      isCloseNotificationButtonDisplayed()).to.be.true;
    expect(await popupPage.
      isStopShowingNotificationsButtonDisplayed()).to.be.false;
    await popupPage.clickCloseNotificationButton();
    expect(await popupPage.
      isNotificationMessageDisplayed()).to.be.false;
  });

  it("should display default notification", async function()
  {
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin);
    await browser.executeScript(notificationScripts.defaultNotification, []);
    expect(await popupPage.
      getNotificationBorderColor()).to.equal("rgb(255, 143, 0)");
    expect(await popupPage.
      isCloseNotificationButtonDisplayed()).to.be.true;
    expect(await popupPage.
      isStopShowingNotificationsButtonDisplayed()).to.be.true;
    await popupPage.clickLinkInNotificationMessage();
    await popupPage.switchToTab("https://adblockplus.org/");
    expect(await popupPage.getCurrentUrl()).to.equal(
      "https://adblockplus.org/");
  });

  it("should display information notification", async function()
  {
    const popupPage = new PopupPage(browser);
    await popupPage.init(globalOrigin);
    await browser.executeScript(
      notificationScripts.informationNotification, []);
    expect(await popupPage.
      getNotificationBorderColor()).to.equal("rgb(7, 151, 225)");
    expect(await popupPage.
      isCloseNotificationButtonDisplayed()).to.be.true;
    expect(await popupPage.
      isStopShowingNotificationsButtonDisplayed()).to.be.true;
    await popupPage.clickStopShowingNotificationsButton();
    expect(await popupPage.
      isNotificationMessageDisplayed()).to.be.false;
  });
});
