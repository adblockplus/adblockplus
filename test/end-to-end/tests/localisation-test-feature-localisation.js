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

const {beforeSequence, globalRetriesNumber,
       doesTabExist} = require("../helpers");
const {expect} = require("chai");
const GeneralPage = require("../page-objects/general.page");

describe("test features for German language", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should display features for German language", async function()
  {
    const generalPage = new GeneralPage(browser);
    expect(await doesTabExist(/first-run\.html/)).to.be.true;
    expect(await doesTabExist("https://welcome.adblockplus.org/en/installed")).to.be.false;
    await generalPage.switchToTab(/options\.html/);
    expect(await generalPage.
      isNotifyLanguageFilterListsCheckboxDisplayed(true)).to.be.true;
    await generalPage.clickContributeButton();
    expect(await doesTabExist("https://adblockplus.org/de/contribute?link=contribute&lang=de")).to.be.true;
  });
});
