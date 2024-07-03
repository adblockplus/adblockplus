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

const {expect} = require("chai");
const testData = require("../../../test-data/data-smoke-tests");

module.exports = async function(expectedUrl, appVersion)
{
  const url = await browser.getUrl();
  expect(url).to.have.string(expectedUrl);

  const browserCapabilities = await browser.capabilities;
  let majorBrowserVersion = (JSON.stringify(browserCapabilities)).
    match(testData.regexMajorBrowserVersion)[0];
  expect(majorBrowserVersion).to.equal(url.match(testData.regex_apv)[0]);
  if (browser.capabilities.browserName.toLowerCase().includes("firefox"))
  {
    const navigatorText = await browser.
      executeScript("return navigator.userAgent;", []);
    majorBrowserVersion = navigatorText.
      match(testData.regexMajorBrowserVersionFF)[0];
    expect(majorBrowserVersion).to.equal(url.match(testData.regex_pv)[0]);
  }
  else
  {
    expect(majorBrowserVersion).to.equal(url.match(testData.regex_pv)[0]);
  }
  expect(appVersion).to.equal(url.match(testData.regex_av)[0]);

  const browserName = browser.capabilities.browserName.toLowerCase();
  const expectedData =
  {
    chrome: {an: "adblockpluschrome", ap: "chrome", p: "chromium"},
    microsoftedge: {an: "adblockpluschrome", ap: "edge", p: "chromium"},
    firefox: {an: "adblockplusfirefox", ap: "firefox", p: "gecko"}
  }[browserName];
  if (!expectedData)
  {
    throw new Error(`Browser name not recognized: ${browserName}`);
  }

  expect(expectedData.an).to.equal(url.match(testData.regex_an)[0]);
  expect(expectedData.ap).to.equal(url.match(testData.regex_ap)[0]);
  expect(expectedData.p).to.equal(url.match(testData.regex_p)[0]);
};
