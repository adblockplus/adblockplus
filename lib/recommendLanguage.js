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

const ewe = require("@eyeo/webext-ad-filtering-solution");

const {SessionStorage} = require("storage/session");
const {info} = require("../src/info/background");
const {Prefs} = require("prefs");

/**
 * Rolling list of websites the user visited most recently
 *
 * @typedef {Object[]} LastVisits
 */

/**
 * Key to store/retrieve the [list of last visited websites]{@link LastVisits}
 */
const lastVisitsKey = "lastVisits";

const session = new SessionStorage("recommendLanguage");

let promisedLanguages;
let recommendationByLocale;
let recommendationUrls;

async function addVisit(url, locale)
{
  const domain = new URL(url).hostname;
  const visit = {domain, locale};

  const lastVisits = await session.get(lastVisitsKey) || [];
  if (lastVisits.length === 10)
  {
    lastVisits.shift();
  }
  lastVisits.push(visit);
  await session.set(lastVisitsKey, lastVisits);

  const distinctDomains = new Set();
  for (const prevVisit of lastVisits)
  {
    if (prevVisit.locale !== locale)
      continue;

    distinctDomains.add(prevVisit.domain);
  }
  return distinctDomains.size;
}

function normalizeLocale(locale)
{
  const match = /^[a-z]+/.exec(locale.toLowerCase());
  if (!match)
    return null;

  return match[0];
}

async function getExplicitTabLanguage(tabId)
{
  // We need to use both browser.tabs.executeScript and
  // browser.scripting.executeScript because they're exclusive to
  // Manifest v2 and v3 respectively
  if (browser.scripting)
  {
    const [frameResult] = await browser.scripting.executeScript({
      target: {tabId},
      func: () => document.documentElement.lang
    });
    return frameResult.result;
  }

  const [lang] = await browser.tabs.executeScript(
    tabId,
    {code: "document.documentElement.lang"}
  );
  return lang;
}

async function getTabLanguage(tabId)
{
  try
  {
    let [explicit, implicit] = await Promise.all([
      getExplicitTabLanguage(tabId),
      browser.tabs.detectLanguage(tabId)
    ]);

    // We're only interested in the language, not the specific locale, and
    // the language codes may also be in a different format
    explicit = normalizeLocale(explicit);
    implicit = normalizeLocale(implicit);

    // We want both sources to agree to be sure we got it right
    if (!explicit || !implicit || explicit != implicit)
      return null;

    return explicit;
  }
  catch (ex)
  {
    // We cannot run our script on certain pages (e.g. Chrome Web Store)
    return null;
  }
}

async function getInstalledRecommendationsCount()
{
  let count = 0;

  for (const subscription of await ewe.subscriptions.getSubscriptions())
  {
    if (!recommendationUrls.has(subscription.url))
      continue;

    count++;
  }

  return count;
}

async function onNavigation(details)
{
  // User opted out so nothing to do
  if (!Prefs.recommend_language_subscriptions)
    return;

  // Ignore subframes
  if (details.frameId !== 0)
    return;

  // Ignore non-HTTP(S) pages (e.g. New Tab Page)
  if (!/^https?:/.test(details.url))
    return;

  // Support for English is already included in all language filter lists
  // so we don't need to recommend adding another list
  const locale = await getTabLanguage(details.tabId);
  if (!locale || locale === "en")
    return;

  // We don't want to recommend filter lists right away but only after
  // visiting related websites a couple of times
  if (await addVisit(details.url, locale) < 3)
    return;

  // Does recommended filter list exist for given language?
  const subscriptionUrl = recommendationByLocale.get(locale);
  if (!subscriptionUrl)
    return;

  // Is filter list already installed?
  if (await ewe.subscriptions.has(subscriptionUrl))
    return;

  // Are enough recommended filter lists already installed?
  const installedCount = await getInstalledRecommendationsCount();
  if (installedCount > 2)
    return;

  // We need to know the name of the language in order to display
  // the notification properly
  const languages = await promisedLanguages;
  const languageName = languages.nativeNames[locale];
  if (!languageName)
    return;

  // Show notification
  ewe.notifications.addNotification({
    id: `reclang-${locale}`,
    type: "information",
    message: browser.i18n.getMessage(
      "notification_recommendLanguage_message",
      [languageName]
    ),
    links: [`abp:subscribe:ads:${locale}`]
  });
  void ewe.notifications.showNext();
}

function initRecommendations()
{
  recommendationByLocale = new Map();
  recommendationUrls = new Set();

  for (const recommendation of ewe.subscriptions.getRecommendations())
  {
    if (recommendation.type !== "ads")
      continue;

    const locales = recommendation.languages;
    if (!locales)
      continue;

    recommendationUrls.add(recommendation.url);
    for (const locale of locales)
    {
      recommendationByLocale.set(locale, recommendation.url);
    }
  }
}

exports.start = async() =>
{
  // Don't initiate language recommendation feature for Opera users
  // due to problems with its language detection
  // https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/issues/960
  if (info.application === "opera")
    return;

  const uiLanguage = browser.i18n.getUILanguage();
  if (/^(?:de|fr)\b/.test(uiLanguage))
    return;

  const platformInfo = await browser.runtime.getPlatformInfo();
  if (platformInfo.os === "android")
    return;

  promisedLanguages = fetch("data/locales.json")
    .then((resp) => resp.json());
  initRecommendations();

  browser.webNavigation.onCompleted.addListener(onNavigation);
};
