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

const {waitForExtension} = require("../helpers");
const {expect} = require("chai");
const GeneralPage = require("../page-objects/general.page");
const AdvancedPage = require("../page-objects/advanced.page");
let browser = null;

describe("test options page general tab recommended filters", () =>
{
  beforeEach(async() =>
  {
    let origin = null;
    [browser, origin] = await waitForExtension();
    await browser.url(`${origin}/desktop-options.html`);
  });

  afterEach(async() =>
  {
    await browser.deleteSession();
  });

  it("should block additional tracking", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickBlockAdditionalTrackingCheckbox();
    expect(await generalPage.
      isBlockAdditionalTrackingCheckboxSelected()).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isEasyPrivacyFLDisplayed()).to.be.true;
    await generalPage.init();
    await generalPage.clickBlockAdditionalTrackingCheckbox();
    expect(await generalPage.
      isBlockAdditionalTrackingCheckboxSelected()).to.be.false;
    await advancedPage.init();
    expect(await advancedPage.
      isEasyPrivacyFLDisplayed()).to.be.false;
  });

  it("should block cookie warnings", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickBlockCookieWarningsCheckbox();
    expect(await generalPage.
      isBlockCookieWarningsCheckboxSelected()).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isIDontCareAboutCookiesFLDisplayed()).to.be.true;
    await generalPage.init();
    await generalPage.clickBlockCookieWarningsCheckbox();
    expect(await generalPage.
      isBlockCookieWarningsCheckboxSelected()).to.be.false;
    await advancedPage.init();
    expect(await advancedPage.
      isIDontCareAboutCookiesFLDisplayed()).to.be.false;
  });

  it("should block push notifications", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickBlockPushNotificationsCheckbox();
    expect(await generalPage.
      isBlockPushNotificationsCheckboxSelected()).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isFanboysNotificationsBlockingListFLDisplayed()).to.be.true;
    await generalPage.init();
    await generalPage.clickBlockPushNotificationsCheckbox();
    expect(await generalPage.
      isBlockPushNotificationsCheckboxSelected()).to.be.false;
    await advancedPage.init();
    expect(await advancedPage.
      isFanboysNotificationsBlockingListFLDisplayed()).to.be.false;
  });

  it("should block social media icons tracking", async() =>
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.clickBlockSocialMediaIconsTrackingCheckbox();
    expect(await generalPage.
      isBlockSocialMediaIconsTrackingCheckboxSelected()).to.be.true;
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    expect(await advancedPage.
      isFanboysSocialBlockingListFLDisplayed()).to.be.true;
    await generalPage.init();
    await generalPage.clickBlockSocialMediaIconsTrackingCheckbox();
    expect(await generalPage.
      isBlockSocialMediaIconsTrackingCheckboxSelected()).to.be.false;
    await advancedPage.init();
    expect(await advancedPage.
      isFanboysSocialBlockingListFLDisplayed()).to.be.false;
  });
});
