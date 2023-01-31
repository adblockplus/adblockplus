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
const GeneralPage = require("../page-objects/general.page");
const AdvancedPage = require("../page-objects/advanced.page");

describe("test options page general tab recommended filters", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  afterEach(async function()
  {
    await afterSequence();
  });

  it("should block additional tracking", async function()
  {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isBlockAdditionalTrackingCheckboxSelected(true)).to.be.true;
    expect(await generalPage.getBlockAdditionalTrackingDescriptionText()).
      to.equal("Protect your privacy from known entities that may track your" +
      " online activity across websites you visit.");
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
      isBlockAdditionalTrackingCheckboxSelected(true)).to.be.true;
    await advancedPage.init();
    expect(await advancedPage.
      isEasyPrivacyFLDisplayed()).to.be.false;
  });

  it("should block push notifications", async function()
  {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isBlockPushNotificationsCheckboxSelected(true)).to.be.true;
    expect(await generalPage.getBlockPushNotificationsDescriptionText()).
      to.equal("Stop websites from asking you to allow push notifications th" +
      "at could track your online activity.");
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
      isBlockPushNotificationsCheckboxSelected(true)).to.be.true;
    await advancedPage.init();
    expect(await advancedPage.
      isFanboysNotificationsBlockingListFLDisplayed()).to.be.false;
  });

  it("should block social media icons tracking", async function()
  {
    const generalPage = new GeneralPage(browser);
    expect(await generalPage.
      isBlockSocialMediaIconsTrackingCheckboxSelected(true)).to.be.true;
    expect(await generalPage.getBlockSocialMediaIconsTrackingDescriptionText())
      .to.equal("Prevent social media networks from building a profile of yo" +
      "u based on your browsing habits.");
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
      isBlockSocialMediaIconsTrackingCheckboxSelected(true)).to.be.true;
    await advancedPage.init();
    expect(await advancedPage.
      isFanboysSocialBlockingListFLDisplayed()).to.be.false;
  });
});
