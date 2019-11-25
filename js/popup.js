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
require("./popup.notifications.js");

const setupToggles = require("./popup.toggles.js");
const setupBlock = require("./popup.blockelement.js");
const {activeTab} = require("./popup.utils.js");
const api = require("./api");
const {$, $$} = require("./dom");

const {
  getDoclinks,
  getPref,
  reportIssue,
  whenPageReady
} = require("./popup.utils.js");

// platform and application dataset bootstrap
Promise.all([
  // one is used to hide the Issue Reporter due EdgeHTML bug
  // the Issue Reporter should work once MSEdge ships with Chromium instead
  browser.runtime.sendMessage({
    type: "app.get",
    what: "platform"
  }),
  // one is used to hide all Edge specific things (i.e. 3rd parts links)
  browser.runtime.sendMessage({
    type: "app.get",
    what: "application"
  })
]).then(([platform, application]) =>
{
  // this won't ever change during ABP lifecycle, which is why
  // it's set ASAP as data-platform attribute, on the most top element,
  // instead of being one of the body classes
  const {dataset} = document.documentElement;
  dataset.platform = platform;
  dataset.application = application;
});

activeTab.then(tab =>
{
  const urlProtocol = tab.url && new URL(tab.url).protocol;
  if (/^https?:$/.test(urlProtocol))
  {
    whenPageReady(tab).then(() =>
    {
      document.body.classList.remove("nohtml");
    });
  }
  else
  {
    disablePopup();
    document.body.classList.add("ignore");
    document.body.classList.remove("nohtml");
  }
  return tab;
})
.then(tab =>
{
  const {url} = tab;
  const defaultDetails = {hostname: "", pathname: ""};
  const {hostname, pathname} = url ? new URL(url) : defaultDetails;
  $("#blocking-domain").textContent = hostname;
  $("#blocking-page").textContent = pathname;
  $("#issue-reporter").addEventListener(
    "click", () => reportIssue(tab)
  );
  // drop the text content but keep it as aria-label
  const options = $("#options");
  options.setAttribute("aria-label", options.textContent);
  options.textContent = "";
  options.addEventListener("click", () =>
  {
    browser.runtime.sendMessage(
      {type: "app.open", what: "options"}
    ).then(
      // force closing popup which is not happening in Firefox
      // @link https://issues.adblockplus.org/ticket/7017
      () => window.close()
    );
  });
  setupToggles(tab);
  setupStats(tab);
  setupBlock(tab);
  setupFooter();
});

function disablePopup()
{
  document.body.classList.add("disabled");
  const buttons = $$("#page-info button, io-circle-toggle");
  for (const button of buttons)
    button.disabled = true;
}

function setupFooter()
{
  // order matters and reflected later on
  // by selecting apple first and android after
  getDoclinks({links: [
    "adblock_browser_ios_store",
    "adblock_browser_android_store"
  ]}).then(links =>
  {
    // using forEach instead of for/of due its handy index
    // NodeList.prototype.forEach is available since Chrome 51
    const forEach = Array.prototype.forEach;
    forEach.call($$("footer .apple, footer .android"), (button, i) =>
    {
      button.dataset.link = links[i];
      button.addEventListener("click", gotoMobile);
    });
  });
}

function gotoMobile(event)
{
  event.preventDefault();
  event.stopPropagation();
  browser.tabs
    .create({url: event.currentTarget.dataset.link})
    .then(
      // force closing popup which is not happening in Firefox
      // @link https://issues.adblockplus.org/ticket/7017
      () => window.close()
    );
}

function updateStats(tab, blockedTotal)
{
  api.stats.getBlocked(tab).then((blockedPage) =>
  {
    ext.i18n.setElementText(
      $("#stats-page"),
      "stats_label_page",
      [blockedPage.toLocaleString()]
    );
  });

  ext.i18n.setElementText(
    $("#stats-total"),
    "stats_label_total",
    [blockedTotal.toLocaleString()]
  );
}

function setupStats(tab)
{
  api.prefs.get("blocked_total").then((blockedTotal) =>
  {
    updateStats(tab, blockedTotal);
  });

  api.port.onMessage.addListener((msg) =>
  {
    if (msg.type !== "prefs.respond" || msg.action !== "blocked_total")
      return;

    updateStats(tab, msg.args[0]);
  });

  api.port.postMessage({
    type: "prefs.listen",
    filter: ["blocked_total"]
  });
}
