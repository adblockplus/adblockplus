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

import {$} from "../../dom";

function setupBlock(tab)
{
  $("#block-element").addEventListener("click", () =>
  {
    $("#page-info").classList.add("blocking");
    activateClickHide(tab);
  });

  $("#block-element-cancel").addEventListener("click", () =>
  {
    $("#page-info").classList.remove("blocking");
    cancelClickHide(tab);
  });

  browser.tabs.sendMessage(tab.id, {type: "composer.content.getState"})
    .then(response =>
    {
      if (response && response.active)
        $("#page-info").classList.add("blocking");
    })
    .catch((err) =>
    {
      // We expect the sending of this message to fail whenever
      // our content script isn't running on the page.
    });
}

let timeout = 0;

function activateClickHide(tab)
{
  browser.tabs.sendMessage(tab.id, {
    type: "composer.content.startPickingElement"
  });

  // Close the popup after a few seconds, so user doesn't have to
  timeout = window.setTimeout(window.close, 5000);
}

function cancelClickHide(tab)
{
  if (timeout != 0)
  {
    window.clearTimeout(timeout);
    timeout = 0;
  }
  browser.tabs.sendMessage(tab.id, {type: "composer.content.finished"});
}

export default setupBlock;
