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

function convertDoclinks()
{
  const links = document.querySelectorAll("a[data-doclink]");
  for (const link of links)
  {
    getDoclink(link.dataset.doclink).then((url) =>
    {
      link.target = link.target || "_blank";
      link.href = url;
    });
  }
}
window.addEventListener("DOMContentLoaded", convertDoclinks, true);

function getDoclink(link)
{
  return browser.runtime.sendMessage({
    type: "app.get",
    what: "doclink",
    link
  });
}

function getErrorMessage(error)
{
  let message = null;

  if (error)
  {
    message = browser.i18n.getMessage(
      error.reason || error.type,
      (error.selector) ? [error.selector] : []
    );
  }

  // Use a generic error message if we don't have one available yet
  if (!message)
  {
    message = browser.i18n.getMessage("filter_action_failed");
  }

  if (!error || typeof error.lineno !== "number")
    return message;

  return browser.i18n.getMessage("line", [
    error.lineno.toLocaleString(),
    message
  ]);
}
