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

const api = require("../../api");
const {$, $$} = require("../../dom");
require("../../io-circle-toggle.js");
const setupBlock = require("./block-element.js");
require("./notifications.js");
const {createShareLink} = require("./social-media-share.js");
const setupToggles = require("./toggles.js");
const {
  activeTab,
  getDoclinks,
  reportIssue,
  whenPageReady
} = require("./utils.js");

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
    document.body.classList.add("disabled");
    document.body.classList.add("ignore");
    document.body.classList.remove("nohtml");
  }

  document.body.classList.toggle("private", tab.incognito);

  return tab;
})
.then(tab =>
{
  const {url} = tab;
  const defaultDetails = {hostname: "", pathname: "", search: ""};
  const {hostname, pathname, search} = url ? new URL(url) : defaultDetails;
  $("#blocking-domain").textContent = hostname;
  let pageContent = pathname;
  if (!search.includes("&"))
  {
    pageContent += search;
  }
  else if (search)
  {
    pageContent += "?…";
  }
  $("#blocking-page").textContent = pageContent;
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
  setupShare();
  setupFooter();
});

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

function updateBlockedPerPage(blockedPage)
{
  $("#stats-page .amount").textContent = blockedPage.toLocaleString();
}

function updateBlockedTotal(blockedTotal)
{
  const total = blockedTotal.toLocaleString();
  $("#stats-total .amount").textContent = total;

  // whenever the total changes, update social media shared stats links too
  for (const media of ["facebook", "twitter", "weibo"])
  {
    const link = $(`#counter-panel .share a.${media}`);
    link.target = "_blank";
    link.href = createShareLink(media, blockedTotal);
  }
}

function setupStats(tab)
{
  api.stats.getBlockedPerPage(tab).then((blockedPage) =>
  {
    updateBlockedPerPage(blockedPage);
  });
  api.stats.getBlockedTotal().then((blockedTotal) =>
  {
    updateBlockedTotal(blockedTotal);
  });

  api.port.onMessage.addListener((msg) =>
  {
    if (msg.type !== "stats.respond")
      return;

    switch (msg.action)
    {
      case "blocked_per_page":
        if (msg.args[0].tabId === tab.id)
        {
          updateBlockedPerPage(msg.args[0].blocked);
        }
        break;
      case "blocked_total":
        updateBlockedTotal(msg.args[0]);
        break;
    }
  });

  api.port.postMessage({
    type: "stats.listen",
    filter: ["blocked_per_page", "blocked_total"]
  });
}

function setupShare()
{
  const wrapper = $("#counter-panel .share");
  const shareButton = $(".enter", wrapper);
  const cancelButton = $(".cancel", wrapper);
  const firstFocusable = $("a", wrapper);
  const indexed = $$("[tabindex]", wrapper);

  const isExpanded = () => wrapper.classList.contains("expanded");

  // when sharing link enters the container, it should get focused,
  // but only if the focus was still in the sharedButton
  firstFocusable.addEventListener("transitionend", () =>
  {
    if (isExpanded() && document.activeElement === shareButton)
      firstFocusable.focus();
  });

  wrapper.addEventListener("transitionend", () =>
  {
    const expanded = isExpanded();

    // add/drop tabindex accordingly with the expanded value
    const tabindex = expanded ? 0 : -1;
    for (const el of indexed)
    {
      el.setAttribute("tabindex", tabindex);
    }
    shareButton.setAttribute("tabindex", expanded ? -1 : 0);

    // if it's not expanded, and the cancel was clicked, and it's still focused
    // move the focus back to the shareButton
    if (!expanded && document.activeElement === cancelButton)
      shareButton.focus();
  });

  shareButton.addEventListener("click", (event) =>
  {
    event.preventDefault();
    wrapper.classList.add("expanded");
  });

  cancelButton.addEventListener("click", (event) =>
  {
    event.preventDefault();
    wrapper.classList.remove("expanded");
  });
}
