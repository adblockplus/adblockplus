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
const DayOnePage = require("../page-objects/dayOne.page");
const FirstRunPage = require("../page-objects/firstRun.page");
const HeartDialogChunk = require("../page-objects/heartDialog.chunk");
const ProblemPage = require("../page-objects/problem.page");
const UpdatesPage = require("../page-objects/updates.page");
const dayOnePageData =
  require("../test-data/data-page-links").dayOnePageData;
const firstRunPageData =
  require("../test-data/data-page-links").firstRunPageData;
const problemPageData =
  require("../test-data/data-page-links").problemPageData;
const updatesPageData =
  require("../test-data/data-page-links").updatesPageData;
let globalOrigin;

describe("test page links", function()
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

  firstRunPageData.forEach(async(dataSet) =>
  {
    it("should have a link for: " + dataSet.testName, async function()
    {
      let isPromotionLinksTest = false;
      if (dataSet.testName == "First run - App Store" ||
        dataSet.testName == "First run - Google Play")
      {
        isPromotionLinksTest = true;
      }
      if (browser.capabilities.browserName == "msedge" &&
        isPromotionLinksTest)
      {
        console.warn("Test skipped for Edge.");
      }
      else
      {
        const firstRunPage = new FirstRunPage(browser);
        await firstRunPage.init(globalOrigin);
        await firstRunPage.waitForEnabledThenClick(
          firstRunPage[dataSet.elementToClick]);
        await firstRunPage.switchToTab(dataSet.newTabUrl);
        if (dataSet.newTabUrl != "/options.html")
        {
          expect(await firstRunPage.getCurrentUrl()).to.equal(
            dataSet.newTabUrl);
        }
        else
        {
          expect(await firstRunPage.getCurrentUrl()).to.equal(
            globalOrigin + dataSet.newTabUrl);
        }
      }
    });
  });

  dayOnePageData.forEach(async(dataSet) =>
  {
    it("should have a link for: " + dataSet.testName, async function()
    {
      const dayOnePage = new DayOnePage(browser);
      await dayOnePage.init(globalOrigin);
      if (dataSet.testName != "Day 1 - Contact us")
      {
        await dayOnePage.waitForEnabledThenClick(
          dayOnePage[dataSet.elementToClick]);
        await dayOnePage.switchToTab(dataSet.newTabUrl);
        expect(await dayOnePage.getCurrentUrl()).to.equal(
          dataSet.newTabUrl);
      }
      else
      {
        expect(await dayOnePage[dataSet.elementToClick].
          getAttribute("href")).to.equal(dataSet.newTabUrl);
      }
    });
  });

  problemPageData.forEach(async(dataSet) =>
  {
    it("should have a link for: " + dataSet.testName, async function()
    {
      const problemPage = new ProblemPage(browser);
      await problemPage.init(globalOrigin);
      if (dataSet.testName == "Problem - Envelope icon")
      {
        expect(await problemPage[dataSet.elementToClick].
          getAttribute("href")).to.equal(dataSet.newTabUrl);
      }
      else if (dataSet.testName == "Problem - Uninstall and reinstall")
      {
        await problemPage.waitForEnabledThenClick(
          problemPage[dataSet.elementToClick]);
        if (browser.capabilities.browserName == "chrome")
        {
          await problemPage.switchToTab(
            dataSet.chromeWebstorePageTitle);
          // Cookies agreement page was removed by Chrome.
          // Keeping this functionality here in case it changes back.
          // await browser.keys("Tab");
          // await browser.keys("Tab");
          // await browser.keys("Tab");
          // await browser.keys("Tab");
          // await browser.keys("Enter");
          expect(await problemPage.getCurrentUrl()).to.equal(
            dataSet.newTabUrlChrome);
        }
        else if (browser.capabilities.browserName == "firefox")
        {
          const heartDialogChunk = new HeartDialogChunk(browser);
          await heartDialogChunk.switchToAddonsTab();
          expect(await heartDialogChunk.getCurrentUrl()).to.include(
            dataSet.newTabUrlFirefox);
        }
      }
      else
      {
        await problemPage.waitForEnabledThenClick(
          problemPage[dataSet.elementToClick]);
        await problemPage.switchToTab(dataSet.newTabUrl);
        expect(await problemPage.getCurrentUrl()).to.equal(
          dataSet.newTabUrl);
      }
    });
  });

  updatesPageData.forEach(async(dataSet) =>
  {
    it("should have a link for: " + dataSet.testName, async function()
    {
      if (dataSet.testName == "Updates - Rate it" &&
        browser.capabilities.browserName == "msedge")
      {
        console.warn("Test skipped for Edge.");
      }
      else
      {
        const updatesPage = new UpdatesPage(browser);
        await updatesPage.init(globalOrigin);
        if (dataSet.testName == "Updates - Envelope icon")
        {
          expect(await updatesPage[dataSet.elementToClick].
            getAttribute("href")).to.equal(dataSet.newTabUrl);
        }
        else if (dataSet.testName == "Updates - Rate it")
        {
          await updatesPage.waitForEnabledThenClick(
            updatesPage[dataSet.elementToClick]);
          if (browser.capabilities.browserName == "chrome")
          {
            await updatesPage.switchToTab(
              dataSet.chromeWebstorePageTitle);
            // Cookies agreement page was removed by Chrome.
            // Keeping this functionality here in case it changes back.
            // await browser.keys("Tab");
            // await browser.keys("Tab");
            // await browser.keys("Tab");
            // await browser.keys("Tab");
            // await browser.keys("Enter");
            expect(await updatesPage.getCurrentUrl()).to.equal(
              dataSet.newTabUrlChrome);
          }
          else if (browser.capabilities.browserName == "firefox")
          {
            const heartDialogChunk = new HeartDialogChunk(browser);
            await heartDialogChunk.switchToAddonsTab();
            expect(await heartDialogChunk.getCurrentUrl()).to.include(
              dataSet.newTabUrlFirefox);
          }
        }
        else
        {
          await updatesPage.waitForEnabledThenClick(
            updatesPage[dataSet.elementToClick]);
          await updatesPage.switchToTab(dataSet.newTabUrl);
          expect(await updatesPage.getCurrentUrl()).to.include(
            dataSet.newTabUrl);
        }
      }
    });
  });
});
