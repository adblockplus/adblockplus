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

import api from "../api";
import {convertDoclinks} from "../common";
import {$} from "../dom";
import {initI18n, setElementText, stripTagsUnsafe} from "../i18n";

import "../landing";

function initContact()
{
  const email = "support@adblockplus.org";
  const subject = browser.i18n.getMessage("day1_community_contact_subject");
  const uri = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  $("#contact").href = uri;
}

function initPopupDummy()
{
  const popupDummy = $("iframe");
  // Accessing the frame's Window from here causes the browser API to become
  // unavailable to the frame. Therefore we're using our own instead.
  window.addEventListener("message", (ev) =>
  {
    if (!ev.data || ev.data.type !== "popup-dummy.resize")
      return;

    popupDummy.height = ev.data.height;
  });
}

function initTitle()
{
  api.stats.getBlockedTotal()
    .then((blockedTotal) =>
    {
      blockedTotal = blockedTotal.toLocaleString();
      setElementText(
        $("#content-message"),
        "day1_header_title",
        [blockedTotal]
      );

      const message = browser.i18n.getMessage(
        "day1_header_title",
        [blockedTotal]
      );
      $("title").textContent = stripTagsUnsafe(message);
    });
}

convertDoclinks();
initI18n();
initContact();
initPopupDummy();
initTitle();
