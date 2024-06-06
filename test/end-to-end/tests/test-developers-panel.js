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

const {beforeSequence} = require("../helpers");
const {expect} = require("chai");
const DevToolsPanelPage = require("../page-objects/devToolsPanel.page");
const devPanelFilteringStates =
  require("../test-data/data-dev-tools-panel").devPanelFilteringStates;
const devPanelFilteringTypes =
  require("../test-data/data-dev-tools-panel").devPanelFilteringTypes;

describe("test abp developers panel", function()
{
  before(async function()
  {
    await beforeSequence();
    const devToolsPanelPage = new DevToolsPanelPage(browser);
    await devToolsPanelPage.init();
    await devToolsPanelPage.switchToTab(/devtools-panel/);
  });

  it("should display expected filtering states", async function()
  {
    const devToolsPanelPage = new DevToolsPanelPage(browser);
    const filteringStateTexts =
      await devToolsPanelPage.getFilteringStateOptionsTexts();
    let filteringStatesCorrect = true;
    for (let i = 0; i < devPanelFilteringStates.length; i++)
    {
      if (devPanelFilteringStates[i] != filteringStateTexts[i])
      {
        filteringStatesCorrect = false;
      }
    }
    expect(filteringStatesCorrect).to.be.true;
  });

  it("should display expected filtering types", async function()
  {
    const devToolsPanelPage = new DevToolsPanelPage(browser);
    const filteringTypeTexts =
      await devToolsPanelPage.getFilteringTypeOptionsTexts();
    let filteringTypesCorrect = true;
    for (let i = 0; i < devPanelFilteringTypes.length; i++)
    {
      if (devPanelFilteringTypes[i] != filteringTypeTexts[i])
        filteringTypesCorrect = false;
    }
    expect(filteringTypesCorrect).to.be.true;
  });
});
