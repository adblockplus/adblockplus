
/* eslint-disable indent */
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
const AllowlistedWebsitesPage =
  require("../page-objects/allowlistedWebsites.page");

describe("test allowlisted websites tab", function()
{
  this.retries(globalRetriesNumber);

  before(async function()
  {
    await beforeSequence();
  });

  it("should display allowlisted websites default state", async function()
  {
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    const attributesOfAllowlistingTableItems = await
      allowistedWebsitesPage.getAttributeOfAllowlistingTableItems("class");
    attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.equal("empty-placeholder");
    });
    expect(await allowistedWebsitesPage.
      isAddWebsiteButtonEnabled()).to.be.false;
  });

  it("should add a website to allowlisted websites", async function()
  {
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    await allowistedWebsitesPage.
      setAllowlistingTextboxValue("allowlisted-domain.com");
    expect(await allowistedWebsitesPage.
      isAddWebsiteButtonEnabled()).to.be.true;
    await allowistedWebsitesPage.clickAddWebsiteButton();
    const attributesOfAllowlistingTableItems = await
      allowistedWebsitesPage.
      getAttributeOfAllowlistingTableItems("aria-label");
      attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.equal("allowlisted-domain.com");
    });
  });

  it("should remove a website from allowlisted websites", async function()
  {
    const allowistedWebsitesPage = new AllowlistedWebsitesPage(browser);
    await allowistedWebsitesPage.init();
    await allowistedWebsitesPage.
      setAllowlistingTextboxValue("allowlisted-domain.com");
    await allowistedWebsitesPage.clickAddWebsiteButton();
    await allowistedWebsitesPage.
      removeAllowlistedDomain("allowlisted-domain.com");
    const attributesOfAllowlistingTableItems = await
      allowistedWebsitesPage.getAttributeOfAllowlistingTableItems("class");
      attributesOfAllowlistingTableItems.forEach(async(element) =>
    {
      expect(element).to.equal("empty-placeholder");
    });
  });
});
