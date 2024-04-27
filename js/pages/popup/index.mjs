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

import api from "../../../src/core/api/front/index.ts";
import {getSourceAttribute} from "../../common.mjs";
import {$, $$} from "../../dom.mjs";
import {initI18n} from "../../../src/i18n/index.ts";
import setupBlock from "./block-element.mjs";
import {createShareLink} from "./social-media-share.mjs";
import setupToggles from "./toggles.mjs";
import {
  activeTab,
  reportIssue,
  whenPageReady
} from "./utils.mjs";

import "../../../src/popup/ui/popup.css";
import "../../io-circle-toggle.mjs";
import "./notifications.mjs";
import "../../io-popup-footer.mjs";

initI18n();

// info (platform, application and store) dataset bootstrap
//
// "platform" is used to hide the Issue Reporter due EdgeHTML bug
// the Issue Reporter should work once MSEdge ships with Chromium instead
//
// "application" is used to hide all Edge specific things (i.e. 3rd parts links)
//
// "store" is used to specify the extension rating redirect link
api.app.getInfo().then(info =>
{
  // this won't ever change during ABP lifecycle, which is why
  // it's set ASAP as data-platform attribute, on the most top element,
  // instead of being one of the body classes
  const {dataset} = document.documentElement;
  ["platform", "application", "store"].forEach(key => dataset[key] = info[key]);
});

activeTab.then(tab =>
{
  const urlProtocol = tab.url && new URL(tab.url).protocol;
  if (!(/^https?:$/.test(urlProtocol)))
  {
    document.body.classList.add("disabled");
    document.body.classList.add("ignore");
  }

  document.body.classList.remove("nohtml");
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
    api.app.open("options").then(
      // force closing popup which is not happening in Firefox
      // @link https://issues.adblockplus.org/ticket/7017
      () => window.close()
    );
  });

  setupPremium();
  setupToggles(tab);
  setupStats(tab);
  setupBlock(tab);
  setupShare();
  setupFooter();

  // closing the popup when the user focus on a different tab,
  // hence, normalizing the behavior across all browsers
  browser.tabs.onActivated.addListener(() =>
  {
    // force closing popup, after user has clicked a link,
    // which is not happening in Firefox
    // @link https://issues.adblockplus.org/ticket/7017
    // we can't rely on "click" events, as Firefox will end up opening
    // the links in a new window, instead of a new tab
    // @link https://bugzilla.mozilla.org/show_bug.cgi?id=1780550
    window.close();
  });

  document.body.hidden = false;
});

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

async function setupPremium()
{
  setupPremiumBanners();

  const premium = await api.premium.get();
  setPremiumState(premium.isActive);

  api.addListener((msg) =>
  {
    if (msg.type !== "premium.respond" || msg.action !== "changed")
      return;

    setupPremiumBanners();
    setPremiumState(msg.args[0].isActive);
  });

  api.premium.listen(["changed"]);
}

async function setupPremiumBanners()
{
  const source = getSourceAttribute(document.body);
  const premiumUpgradeUrl = await api.ctalinks.get("premium-upgrade", {source});
  $("#premium-upgrade").setAttribute("href", premiumUpgradeUrl);
}

function setPremiumState(premiumIsActive)
{
  document.body.classList.toggle("premium", premiumIsActive);
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

  api.addListener((msg) =>
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

  api.stats.listen(["blocked_per_page", "blocked_total"]);
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

function setupFooter()
{
  const footer = document.querySelector("io-popup-footer");

  fetch("data/popup-footer.json")
    .then((res) => res.json())
    .then((msgs) =>
    {
      const msgsToDisplay = msgs.filter(({exceptions}) =>
      {
        if (!exceptions)
          return true;

        return !["platform", "application", "store"].some((info) =>
        {
          const {[info]: exceptionsInfo} = exceptions;

          if (!exceptionsInfo)
            return false;

          const {[info]: browserInfo} = document.documentElement.dataset;

          return exceptionsInfo.includes(browserInfo);
        });
      });

      msgsToDisplay.sort((a, b) => a.order - b.order);

      footer.setState({
        messages: msgsToDisplay,
        current: Math.floor(Math.random() * msgsToDisplay.length)
      });

      footer.startAnimation();
    });
}
