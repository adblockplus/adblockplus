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

const api = require("./api");
const {$} = require("./dom");
require("./landing");

const platformToStore = new Map([
  ["chromium", "chrome"],
  ["edgehtml", "edge"],
  ["gecko", "firefox"]
]);

Promise.all([
  api.app.get("application"),
  api.app.get("platform")
]).then(([application, platform]) =>
{
  document.body.dataset.application = application;

  let store = application;
  // Edge and Opera have their own stores so we should refer to those instead
  if (application !== "edge" && application !== "opera")
  {
    store = platformToStore.get(platform) || "chrome";
  }

  api.doclinks.get(`${store}_store`).then((url) =>
  {
    $("#store-link").href = url;
  });
});

function initOSReference(name, idx)
{
  const element = $(`#solution em[data-i18n-index="${idx}"]`);
  element.classList.add("os", name);
  element.title = browser.i18n.getMessage(`problem_os_${name}`);
}

// We need to wait explicitly for DOMContentLoaded to ensure that the
// translations are already present.
window.addEventListener("DOMContentLoaded", () =>
{
  ["windows", "mac"].forEach(initOSReference);
});
