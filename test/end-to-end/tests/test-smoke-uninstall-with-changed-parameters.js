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

const {beforeSequence, switchToABPOptionsTab} =
  require("../helpers");
const {expect} = require("chai");
const GeneralPage = require("../page-objects/general.page");
const AdvancedPage = require("../page-objects/advanced.page");
const moment = require("moment");

describe("test uninstall after changed params as part of the smoke tests", function()
{
  // This test case can't be retried, because the extension is uninstalled
  this.retries(0);

  before(async function()
  {
    await beforeSequence();
  });

  it("should uninstall extension with changed params as part of the smoke tests", async function()
  {
    await switchToABPOptionsTab(true);
    const generalPage = new GeneralPage(browser);
    await generalPage.init();
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
    // Wait for tab to properly load
    await browser.pause(1500);
    const uninstallCurrentUrl = await generalPage.getCurrentUrl();
    expect(uninstallCurrentUrl).to.have.string("https://adblockplus.org/en/uninstalled");
    const todaysDate = moment().utc().format("YYYYMMDD");
    const url = new URL(uninstallCurrentUrl);
    const params = url.searchParams;
    expect(params.get("s")).to.equal("0");
    expect(params.get("c")).to.equal("0");
    expect(params.get("fv")).to.equal(todaysDate);
  });
});
