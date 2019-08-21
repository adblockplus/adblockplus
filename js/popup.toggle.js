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

const {isPageWhitelisted} = require("./popup.utils.js");
const {$} = require("./dom");

// remember initial state to better toggle content
let toggleChecked;

module.exports = setupToggle;

function setupToggle(tab)
{
  const toggle = $("io-circle-toggle");
  $("#page-refresh button").addEventListener("click", () =>
  {
    browser.tabs.reload(tab.id).then(window.close);
  });

  isPageWhitelisted(tab).then(whitelisted =>
  {
    if (whitelisted)
    {
      document.body.classList.add("disabled");
      $("#block-element").disabled = true;

      // avoid triggering an event on this change
      toggle.setState({checked: false}, false);
      toggle.checked = false;
    }
    toggleChecked = toggle.checked;
  });

  toggle.addEventListener("change", () =>
  {
    const {body} = document;
    const refresh = toggleChecked !== toggle.checked;
    body.classList.toggle("refresh", refresh);
    if (toggle.checked)
    {
      browser.runtime.sendMessage({
        type: "filters.unwhitelist",
        tab
      });
    }
    else
    {
      browser.runtime.sendMessage({
        type: "filters.whitelist",
        tab
      });
    }
  });
}
