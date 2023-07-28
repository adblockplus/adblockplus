/* eslint-disable max-len */
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

const {beforeSequence, globalRetriesNumber} =
  require("../helpers");
const {expect} = require("chai");
const OneClickAllowAdsTestPage =
  require("../page-objects/oneClickAllowAdsTest.page");
const GeneralPage = require("../page-objects/general.page");
const AdvancedPage = require("../page-objects/advanced.page");
const moment = require("moment");

describe("test uninstall after changed params as part of the smoke tests", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should uninstall extension with changed params as part of the smoke tests", async function()
  {
    const generalPage = new GeneralPage(browser);
    await generalPage.switchToInstalledTab();
    const oneClickAllowAdsTestPage = new OneClickAllowAdsTestPage(browser);
    await oneClickAllowAdsTestPage.init();
    await oneClickAllowAdsTestPage.clickOneClickButton();
    await generalPage.switchToABPOptionsTab();
    await generalPage.clickAllowAcceptableAdsCheckbox();
    expect(await generalPage.
        isAllowAcceptableAdsCheckboxSelected(false, 5000));
    const advancedPage = new AdvancedPage(browser);
    await advancedPage.init();
    await advancedPage.clickEasyListFLStatusToggle();
    expect(await advancedPage.
      isEasyListFLStatusToggleSelected()).to.be.false;
    await browser.executeScript("browser.management.uninstallSelf();", []);
    await generalPage.switchToUninstalledTab();
    const uninstallCurrentUrl = await generalPage.getCurrentUrl();
    expect(uninstallCurrentUrl).to.have.string("https://adblockplus.org/en/uninstalled");
    const params = new Proxy(new URLSearchParams(uninstallCurrentUrl),
                             {
                               get: (searchParams, prop) =>
                                 searchParams.get(prop)
                             });
    const todaysDate = moment().utc().format("YYYYMMDD");
    expect(params.wafc).to.equal("1");
    expect(params.ndc).to.equal("1");
    expect(params.s).to.equal("0");
    expect(params.c).to.equal("0");
    expect(params.fv).to.equal(todaysDate);
  });
});
