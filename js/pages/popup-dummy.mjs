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

import {$} from "../dom";
import {initI18n} from "../i18n";

import "../io-circle-toggle";
import "../io-popup-footer";

initI18n();

function onResize()
{
  window.top.postMessage({
    type: "popup-dummy.resize",
    height: document.body.scrollHeight
  }, "*");
}

$("#stats-page .amount").textContent = (18).toLocaleString();
$("#stats-total .amount").textContent = (21412).toLocaleString();

setupFooter();

if ("IntersectionObserver" in window)
{
  const observer = new IntersectionObserver(onResize, {
    root: null,
    // The observer only notifies us when a threshold is passed in either way
    // so we need to specify small enough thresholds to get notified
    // of any size changes
    threshold: Array.from({length: 101}, (value, idx) => idx / 100)
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

function setupFooter()
{
  const footer = document.querySelector("io-popup-footer");

  fetch("data/popup-footer.json")
    .then((res) => res.json())
    .then((messages) =>
    {
      footer.setState({
        messages,
        current: 0
      });
    });
}
