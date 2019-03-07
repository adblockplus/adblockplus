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
const {$, $$} = require("./dom");

module.exports = setupToggle;

function setupToggle(tab)
{
  isPageWhitelisted(tab).then(whitelisted =>
  {
    if (whitelisted)
      whitelistedPage();
  });

  const toggle = $("io-big-toggle");
  toggle.addEventListener("change", () =>
  {
    let sendMessage;
    if (toggle.checked)
    {
      sendMessage = browser.runtime.sendMessage({
        type: "filters.unwhitelist",
        tab
      });
    }
    else
    {
      sendMessage = browser.runtime.sendMessage({
        type: "filters.whitelist",
        tab
      });
    }
    toggle.addEventListener("transitionend", function once()
    {
      if (toggle.refresh)
      {
        toggle.removeEventListener("transitionend", once);
        sendMessage.then(transformStats);
      }
      else
      {
        toggle.refresh = true;
        toggle.addEventListener("click", () =>
        {
          browser.tabs.reload(tab.id).then(window.close);
        });
      }
    });
  });
}

function transformStats()
{
  const pageInfo = $("#page-info");
  pageInfo.style.setProperty(
    "--page-info-height",
    pageInfo.getBoundingClientRect().height + "px"
  );
  const pageStatus = $("#page-status");
  pageStatus.style.setProperty(
    "--page-status-height",
    pageStatus.getBoundingClientRect().height + "px"
  );
  setTimeout(() =>
  {
    document.body.classList.add("refresh");
    const refresh = $(".refresh-info");
    refresh.hidden = false;
  }, 100);
}

function whitelistedPage()
{
  document.body.classList.add("disabled");
  const [
    toggle,
    block
  ] = $$("io-big-toggle, #block-element");
  toggle.checked = false;
  block.disabled = true;
}
