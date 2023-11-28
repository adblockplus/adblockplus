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

/** @module messageResponder */

import * as ewe from "@eyeo/webext-sdk";

import {port} from "./messaging/port.js";
import {Prefs} from "./prefs.js";
import {info} from "../../src/info/background";

function forward(type, message, sender)
{
  return port._onMessage(Object.assign({}, message, {type}), sender);
}

/**
 * Opens given UI page or switches to it, if it's already open
 *
 * @param {string} pathname - UI page path name
 */
async function openUiPage(pathname)
{
  const tabs = await browser.tabs.query({});
  for (const tab of tabs)
  {
    const url = new URL(tab.url);
    if (pathname !== url.pathname)
      continue;

    void browser.tabs.update(tab.id, {active: true});
    return;
  }

  void browser.tabs.create({
    url: browser.runtime.getURL(pathname)
  });
}

/**
 * @deprecated Please send the "filters.getTypes" message instead.
 *
 * @event "types.get"
 */
port.on("types.get",
        (message, sender) => forward("filters.getTypes", message, sender));

/**
 * @deprecated Please send the "options.open" message instead.
 *
 * @event "app.open"
 */
port.on("app.open", async(message, sender) =>
{
  switch (message.what)
  {
    case "options":
      await forward("options.open", message, sender);
      break;
    case "premium-onboarding":
      await openUiPage("premium-onboarding.html");
      break;
  }

  if (message.replaceTab)
    void browser.tabs.remove(sender.page.id);
});

/**
 * @deprecated Please send the "subscriptions.getInitIssues",
 *             "prefs.getDocLink", "subscriptions.getRecommendations",
 *             "devtools.supported" or "info.get" messages, or call the
 *             browser.tabs.getCurrent(), browser.i18n.getUILanguage(),
 *             browser.i18n.getMessage("@@bidi_dir") APIs instead.
 *
 * @event "app.get"
 */
port.on("app.get", async(message, sender) =>
{
  if (message.what == "localeInfo")
  {
    return {
      locale: browser.i18n.getUILanguage(),
      bidiDir: browser.i18n.getMessage("@@bidi_dir")
    };
  }

  if (message.what == "acceptableAdsUrl")
    return ewe.subscriptions.ACCEPTABLE_ADS_URL;

  if (message.what == "acceptableAdsPrivacyUrl")
    return ewe.subscriptions.ACCEPTABLE_ADS_PRIVACY_URL;

  if (message.what == "senderId")
    return sender.page.id;

  if (message.what == "ctalink")
  {
    const ctaLinkNameToPrefsMap = new Map([
      ["premium-manage", "premium_manage_page_url"],
      ["premium-upgrade", "premium_upgrade_page_url"]
    ]);

    const {link: ctaLinkName, queryParams} = message;
    const prefsUrlKey = ctaLinkNameToPrefsMap.get(ctaLinkName);
    let url = Prefs[prefsUrlKey];

    const linkPlaceholders = [
      ["LANG", () => browser.i18n.getUILanguage().replace("-", "_")],
      ["ADDON_NAME", () => info.addonName],
      ["ADDON_VERSION", () => info.addonVersion],
      ["APPLICATION_NAME", () => info.application],
      ["APPLICATION_VERSION", () => info.applicationVersion],
      ["PLATFORM_NAME", () => info.platform],
      ["PLATFORM_VERSION", () => info.platformVersion],
      ["LICENSE_CODE", () => Prefs.get("premium_license").code],
      ["SOURCE", () => queryParams.source]
    ];

    for (const [key, getValue] of linkPlaceholders)
      url = url.replace(`%${key}%`, encodeURIComponent(getValue()));

    return url;
  }

  if (message.what == "doclink")
    return forward("prefs.getDocLink", message, sender);

  if (message.what == "recommendations")
    return forward("subscriptions.getRecommendations", message, sender);

  if (message.what == "features")
  {
    let devToolsPanel = await forward("devtools.supported", message, sender);
    return {devToolsPanel};
  }

  if (message.what == "os")
  {
    let platformInfo = await browser.runtime.getPlatformInfo();
    return platformInfo.os;
  }

  return info[message.what];
});

/**
 * @typedef {object} infoGetResult
 * @property {string} addonName
 *   The extension's name, e.g. "adblockpluschrome".
 * @property {string} addonVersion
 *   The extension's version, e.g. "3.6.3".
 * @property {string} application
 *   The browser's name, e.g. "chrome".
 * @property {string} applicationVersion
 *   The browser's version, e.g. "77.0.3865.90".
 * @property {string} platform
 *   The browser platform, e.g. "chromium".
 * @property {string} platformVersion
 *   The browser platform's version, e.g. "77.0.3865.90".
 */

/**
 * Returns the browser platform information.
 *
 * @event "info.get"
 * @returns {infoGetResult}
 */
port.on("info.get", (message, sender) => info);
