"use strict";

const {filterStorage} = require("filterStorage");
const {notifications} = require("notifications");
const {Prefs} = require("prefs");
const {recommendations} = require("recommendations");
const {
  DownloadableSubscription,
  Subscription
} = require("subscriptionClasses");

const lastVisits = [];
let promisedLanguages;
let recommendationByLocale;
let recommendationUrls;

function addVisit(url, locale)
{
  const domain = new URL(url).hostname;
  const visit = {domain, locale};

  if (lastVisits.length === 10)
  {
    lastVisits.shift();
  }
  lastVisits.push(visit);

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

async function getTabLanguage(tabId)
{
  try
  {
    let [[explicit], implicit] = await Promise.all([
      browser.tabs.executeScript(tabId, {
        code: "document.documentElement.lang"
      }),
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

function getInstalledRecommendationsCount()
{
  let count = 0;

  for (const subscription of filterStorage.subscriptions())
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
  if (locale == "en")
    return;

  // We don't want to recommend filter lists right away but only after
  // visiting related websites a couple of times
  if (addVisit(details.url, locale) < 3)
    return;

  // Does recommended filter list exist for given language?
  const subscriptionUrl = recommendationByLocale.get(locale);
  if (!subscriptionUrl)
    return;

  // Is filter list already installed?
  const subscription = Subscription.fromURL(subscriptionUrl);
  if (filterStorage.hasSubscription(subscription))
    return;

  // Is filter list invalid?
  if (!(subscription instanceof DownloadableSubscription))
    return;

  // Are enough recommended filter lists already installed?
  const installedCount = getInstalledRecommendationsCount();
  if (installedCount > 2)
    return;

  // We need to know the name of the language in order to display
  // the notification properly
  const languages = await promisedLanguages;
  const languageName = languages.nativeNames[locale];
  if (!languageName)
    return;

  // Show notification
  notifications.addNotification({
    id: `reclang-${locale}`,
    type: "information",
    message: browser.i18n.getMessage(
      "notification_recommendLanguage_message",
      [languageName]
    ),
    links: [`abp:subscribe:ads:${locale}`]
  });
  notifications.showNext();
}

function initRecommendations()
{
  recommendationByLocale = new Map();
  recommendationUrls = new Set();

  for (const recommendation of recommendations())
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

(async() =>
{
  const uiLanguage = browser.i18n.getUILanguage();
  if (/^(?:de|fr)\b/.test(uiLanguage))
    return;

  const platformInfo = await browser.runtime.getPlatformInfo();
  if (platformInfo.os === "android")
    return;

  promisedLanguages = fetch("data/locales.json")
    .then((resp) => resp.json());
  initRecommendations();

  browser.webNavigation.onCompleted.addListener(
    onNavigation,
    {urls: ["http://*/*", "https://*/*"]}
  );
})();
