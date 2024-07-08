/* eslint-disable no-unused-vars */
/* eslint-disable no-eval */
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

const {beforeSequence, globalRetriesNumber} = require("../helpers");
const {expect} = require("chai");
const DayOne = require("../page-objects/dayOne.page");
const FirstRunPage = require("../page-objects/firstRun.page");
const GeneralPage = require("../page-objects/general.page");
const PopupPage = require("../page-objects/popup.page");
const ProblemPage = require("../page-objects/problem.page");
const UpdatesPage = require("../page-objects/updates.page");
const uiLocalisationData =
  require("../test-data/data-localisation-tests").uiLocalisationDataAR;
let globalOrigin;

describe("test ui for different languages - Arabic", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    ({origin: globalOrigin} = await beforeSequence(false));
  });

  uiLocalisationData.forEach(async(dataSet) =>
  {
    // eslint-disable-next-line max-len
    it("should correctly display ui for different languages - ar_" + dataSet.pageObject, async function()
    {
      const dayOnePage = new DayOne(browser);
      const generalPage = new GeneralPage(browser);
      const firstRunPage = new FirstRunPage(browser);
      const popupPage = new PopupPage(browser);
      const problemPage = new ProblemPage(browser);
      const updatesPage = new UpdatesPage(browser);
      if (!dataSet.pageObject.includes("generalPage"))
        await await eval(dataSet.pageObject).init(globalOrigin);
      else
        await generalPage.switchToTab(/options\.html/);
      expect((await eval(dataSet.pageObject)[dataSet.functionName]()).
          includes(dataSet.text)).to.be.true;
      const htmlLangAttribute = await $("html").getAttribute("lang");
      const htmlDirAttribute = await $("html").getAttribute("dir");
      expect(htmlLangAttribute).to.equal("ar");
      expect(htmlDirAttribute).to.equal("rtl");
    });
  });
});
