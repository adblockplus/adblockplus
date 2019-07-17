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

require("./io-circle-toggle.js");

function onResize()
{
  window.top.postMessage({
    type: "popup-dummy.resize",
    height: document.body.scrollHeight
  }, "*");
}

ext.i18n.setElementText(
  document.getElementById("stats-total"),
  "stats_label_total",
  [(21412).toLocaleString()]
);
ext.i18n.setElementText(
  document.getElementById("stats-page"),
  "stats_label_page",
  [(18).toLocaleString()]
);

if ("IntersectionObserver" in window)
{
  const observer = new IntersectionObserver(onResize, {
    root: null,
    threshold: 0
  });
  observer.observe(document.body);
}
else
{
  // For older browsers, we expect all changes to have been made to the page
  // at this point so we're telling the embedding page that it's now safe
  // to resize the frame
  window.addEventListener("load", onResize);
}
