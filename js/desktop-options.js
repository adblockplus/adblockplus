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

/* globals getDocLink getErrorMessage */

"use strict";

require("./io-filter-table");
require("./io-list-box");
require("./io-popout");
require("./io-toggle");

const api = require("./api");
const {$, events} = require("./dom");

const {port} = api;

let subscriptionsMap = Object.create(null);
let filtersMap = Object.create(null);
let acceptableAdsUrl = null;
let acceptableAdsPrivacyUrl = null;
let isCustomFiltersLoaded = false;
let additionalSubscriptions = [];
let languages = {};

const collections = Object.create(null);
const {getMessage} = browser.i18n;
const {setElementLinks, setElementText} = ext.i18n;
const customFilters = [];
const filterErrors = new Map([
  ["synchronize_invalid_url",
   "options_filterList_lastDownload_invalidURL"],
  ["synchronize_connection_error",
   "options_filterList_lastDownload_connectionError"],
  ["synchronize_invalid_data",
   "options_filterList_lastDownload_invalidData"],
  ["synchronize_checksum_mismatch",
   "options_filterList_lastDownload_checksumMismatch"]
]);
const timestampUI = Symbol();
const whitelistedDomainRegexp = /^@@\|\|([^/:]+)\^\$document$/;
// Period of time in milliseconds
const minuteInMs = 60000;
const hourInMs = 3600000;
const fullDayInMs = 86400000;

const promisedLocaleInfo = browser.runtime.sendMessage({type: "app.get",
  what: "localeInfo"});
const promisedDateFormat = promisedLocaleInfo.then((addonLocale) =>
{
  return new Intl.DateTimeFormat(addonLocale.locale);
});
const promisedRecommendationsLoaded = loadRecommendations();

function Collection(details)
{
  this.details = details;
  this.items = [];
}

Collection.prototype._setEmpty = function(table, detail, removeEmpty)
{
  if (removeEmpty)
  {
    const placeholders = table.querySelectorAll(".empty-placeholder");
    for (const placeholder of placeholders)
      table.removeChild(placeholder);

    execAction(detail.removeEmptyAction, table);
  }
  else
  {
    const {emptyTexts = []} = detail;
    for (const text of emptyTexts)
    {
      const placeholder = document.createElement("li");
      placeholder.className = "empty-placeholder";
      placeholder.textContent = getMessage(text);
      table.appendChild(placeholder);
    }

    execAction(detail.setEmptyAction, table);
  }
};

Collection.prototype._createElementQuery = function(item)
{
  const access = (item.url || item.text).replace(/'/g, "\\'");
  return function(container)
  {
    return container.querySelector("[data-access='" + access + "']");
  };
};

Collection.prototype._getItemTitle = function(item, i)
{
  if (this.details[i].getTitleFunction)
    return this.details[i].getTitleFunction(item);
  return item.title || item.url || item.text;
};

Collection.prototype._sortItems = function()
{
  this.items.sort((a, b) =>
  {
    // Make sure that Acceptable Ads is always last, since it cannot be
    // disabled, but only be removed. That way it's grouped together with
    // the "Own filter list" which cannot be disabled either at the bottom
    // of the filter lists in the Advanced tab.
    if (a.url && isAcceptableAds(a.url))
      return 1;
    if (b.url && isAcceptableAds(b.url))
      return -1;

    // Make sure that newly added entries always appear on top in descending
    // chronological order
    const aTimestamp = a[timestampUI] || 0;
    const bTimestamp = b[timestampUI] || 0;
    if (aTimestamp || bTimestamp)
      return bTimestamp - aTimestamp;

    const aTitle = this._getItemTitle(a, 0).toLowerCase();
    const bTitle = this._getItemTitle(b, 0).toLowerCase();
    return aTitle.localeCompare(bTitle);
  });
};

Collection.prototype.addItem = function(item)
{
  if (this.items.indexOf(item) >= 0)
    return;

  this.items.push(item);
  this._sortItems();
  for (let j = 0; j < this.details.length; j++)
  {
    const detail = this.details[j];
    const table = $(`#${detail.id}`);
    const template = table.querySelector("template");
    const listItem = document.createElement("li");
    listItem.appendChild(document.importNode(template.content, true));
    listItem.setAttribute("aria-label", this._getItemTitle(item, j));
    listItem.setAttribute("data-access", item.url || item.text);
    listItem.setAttribute("role", "section");

    const tooltip = listItem.querySelector("io-popout[type='tooltip']");
    if (tooltip)
    {
      let tooltipId = tooltip.getAttribute("i18n-body");
      tooltipId = tooltipId.replace("%value%", item.recommended);
      if (getMessage(tooltipId))
      {
        tooltip.setAttribute("i18n-body", tooltipId);
      }
    }

    for (const control of listItem.querySelectorAll(".control"))
    {
      if (control.hasAttribute("title"))
      {
        const titleValue = getMessage(control.getAttribute("title"));
        control.setAttribute("title", titleValue);
      }
    }

    this._setEmpty(table, detail, true);
    if (table.children.length > 0)
      table.insertBefore(listItem, table.children[this.items.indexOf(item)]);
    else
      table.appendChild(listItem);

    this.updateItem(item);
  }
  return length;
};

Collection.prototype.removeItem = function(item)
{
  const index = this.items.indexOf(item);
  if (index == -1)
    return;

  this.items.splice(index, 1);
  const getListElement = this._createElementQuery(item);
  for (const detail of this.details)
  {
    const table = $(`#${detail.id}`);
    const element = getListElement(table);

    // Element gets removed so make sure to handle focus appropriately
    const control = element.querySelector(".control");
    if (control && control == document.activeElement)
    {
      if (!focusNextElement(element.parentElement, control))
      {
        // Fall back to next focusable element within same tab or dialog
        let focusableElement = element.parentElement;
        while (focusableElement)
        {
          if (focusableElement.classList.contains("tab-content") ||
              focusableElement.classList.contains("dialog-content"))
            break;

          focusableElement = focusableElement.parentElement;
        }
        focusNextElement(focusableElement || document, control);
      }
    }

    element.parentElement.removeChild(element);
    if (this.items.length == 0)
      this._setEmpty(table, detail);
  }
};

Collection.prototype.updateItem = function(item)
{
  const oldIndex = this.items.indexOf(item);
  this._sortItems();
  const access = (item.url || item.text).replace(/'/g, "\\'");
  for (let i = 0; i < this.details.length; i++)
  {
    const table = $(`#${this.details[i].id}`);
    const element = table.querySelector("[data-access='" + access + "']");
    if (!element)
      continue;

    const title = this._getItemTitle(item, i);
    const displays = element.querySelectorAll("[data-display]");
    for (let j = 0; j < displays.length; j++)
    {
      if (item[displays[j].dataset.display])
        displays[j].textContent = item[displays[j].dataset.display];
      else
        displays[j].textContent = title;
    }

    element.setAttribute("aria-label", title);
    if (this.details[i].searchable)
      element.setAttribute("data-search", title.toLowerCase());
    const controls = element.querySelectorAll(".control[role='checkbox']");
    for (const control of controls)
    {
      control.setAttribute("aria-checked", item.disabled == false);
      if (isAcceptableAds(item.url) && this == collections.filterLists)
        control.disabled = !item.disabled;
    }
    if (additionalSubscriptions.includes(item.url))
    {
      element.classList.add("preconfigured");
      const disablePreconfigures =
        element.querySelectorAll("[data-disable~='preconfigured']");
      for (const disablePreconfigure of disablePreconfigures)
        disablePreconfigure.disabled = true;
    }

    const lastUpdateElement = element.querySelector(".last-update");
    if (lastUpdateElement)
    {
      const message = element.querySelector(".message");
      if (item.downloading)
      {
        const text = getMessage("options_filterList_lastDownload_inProgress");
        message.textContent = text;
        element.classList.add("show-message");
      }
      else if (item.downloadStatus != "synchronize_ok")
      {
        const error = filterErrors.get(item.downloadStatus);
        if (error)
          message.textContent = getMessage(error);
        else
          message.textContent = item.downloadStatus;
        element.classList.add("show-message");
      }
      else if (item.lastDownload > 0)
      {
        const lastUpdate = item.lastDownload * 1000;
        const sinceUpdate = Date.now() - lastUpdate;
        if (sinceUpdate > fullDayInMs)
        {
          const lastUpdateDate = new Date(item.lastDownload * 1000);
          promisedDateFormat.then((dateFormat) =>
          {
            lastUpdateElement.textContent = dateFormat.format(lastUpdateDate);
          });
        }
        else if (sinceUpdate > hourInMs)
        {
          lastUpdateElement.textContent =
            getMessage("options_filterList_hours");
        }
        else if (sinceUpdate > minuteInMs)
        {
          lastUpdateElement.textContent =
            getMessage("options_filterList_minutes");
        }
        else
        {
          lastUpdateElement.textContent =
            getMessage("options_filterList_now");
        }
        element.classList.remove("show-message");
      }
    }

    const websiteElement = element.querySelector("io-popout .website");
    if (websiteElement)
    {
      if (item.homepage)
        websiteElement.setAttribute("href", item.homepage);
      websiteElement.setAttribute("aria-hidden", !item.homepage);
    }

    const sourceElement = element.querySelector("io-popout .source");
    if (sourceElement)
      sourceElement.setAttribute("href", item.url);

    const newIndex = this.items.indexOf(item);
    if (oldIndex != newIndex)
      table.insertBefore(element, table.childNodes[newIndex]);
  }
};

Collection.prototype.clearAll = function()
{
  this.items = [];
  for (const detail of this.details)
  {
    const table = $(`#${detail.id}`);
    let element = table.firstChild;
    while (element)
    {
      if (element.tagName == "LI" && !element.classList.contains("static"))
        table.removeChild(element);
      element = element.nextElementSibling;
    }

    this._setEmpty(table, detail);
  }
};

function focusNextElement(container, currentElement)
{
  let focusables = container.querySelectorAll("a, button, input, .control");
  focusables = Array.prototype.slice.call(focusables);
  let index = focusables.indexOf(currentElement);
  index += (index == focusables.length - 1) ? -1 : 1;

  const nextElement = focusables[index];
  if (!nextElement)
    return false;

  nextElement.focus();
  return true;
}

collections.cv = new Collection([
  {
    id: "anti-cv-table"
  }
]);
collections.protection = new Collection([
  {
    id: "recommend-protection-list-table"
  }
]);
collections.langs = new Collection([
  {
    id: "blocking-languages-table",
    emptyTexts: ["options_language_empty"],
    getTitleFunction: getLanguageTitle
  }
]);
collections.allLangs = new Collection([
  {
    id: "all-lang-table-add",
    emptyTexts: ["options_dialog_language_other_empty"],
    getTitleFunction: getLanguageTitle
  }
]);
collections.more = new Collection([
  {
    id: "more-list-table",
    setEmptyAction: "hide-more-filters-section",
    removeEmptyAction: "show-more-filters-section"
  }
]);
collections.whitelist = new Collection([
  {
    id: "whitelisting-table",
    emptyTexts: ["options_whitelist_empty_1", "options_whitelist_empty_2"]
  }
]);
collections.filterLists = new Collection([
  {
    id: "all-filter-lists-table",
    emptyTexts: ["options_filterList_empty"],
    getTitleFunction: (item) => item.originalTitle || item.title || item.url
  }
]);

function addSubscription(subscription)
{
  const {disabled, recommended, url} = subscription;
  let collection = null;
  if (recommended)
  {
    if (recommended == "ads")
    {
      if (disabled == false)
        collection = collections.langs;

      collections.allLangs.addItem(subscription);
    }
    else if (recommended == "circumvention")
    {
      collection = collections.cv;
    }
    else
    {
      collection = collections.protection;
    }
  }
  else if (!isAcceptableAds(url) && disabled == false)
  {
    collection = collections.more;
  }

  if (collection)
    collection.addItem(subscription);

  subscriptionsMap[url] = subscription;
}

function updateSubscription(subscription)
{
  for (const name in collections)
    collections[name].updateItem(subscription);

  if (subscription.recommended == "ads")
  {
    if (subscription.disabled)
      collections.langs.removeItem(subscription);
    else
      collections.langs.addItem(subscription);
  }
  else if (!subscription.recommended && !isAcceptableAds(subscription.url))
  {
    if (subscription.disabled == false)
    {
      collections.more.addItem(subscription);
    }
    else
    {
      collections.more.removeItem(subscription);
    }
  }

  if (!(subscription.url in subscriptionsMap))
  {
    subscriptionsMap[subscription.url] = subscription;
  }
}

function updateFilter(filter)
{
  const match = filter.text.match(whitelistedDomainRegexp);
  if (match && !filtersMap[filter.text])
  {
    filter.title = match[1];
    collections.whitelist.addItem(filter);
    if (isCustomFiltersLoaded)
    {
      const text = getMessage("options_whitelist_notification", [filter.title]);
      showNotification(text);
    }
  }
  else
  {
    customFilters.push(filter);
  }

  filtersMap[filter.text] = filter;
}

function loadCustomFilters(filters)
{
  for (const filter of filters)
    updateFilter(filter);

  const cfTable = $("#custom-filters io-filter-table");
  cfTable.filters = customFilters;
}

function removeCustomFilter(text)
{
  const index = customFilters.findIndex(filter => filter.text === text);
  if (index >= 0)
    customFilters.splice(index, 1);
}

function getLanguageTitle(item)
{
  const langs = item.languages.slice();
  const firstLang = langs.shift();
  let title = langs.reduce((acc, lang) =>
  {
    return getMessage("options_language_join", [acc, languages[lang]]);
  }, languages[firstLang]);
  if (item.originalTitle && item.originalTitle.indexOf("+EasyList") > -1)
    title += " + " + getMessage("options_english");
  return title;
}

function loadRecommendations()
{
  return Promise.all([
    fetch("data/languages.json").then((resp) => resp.json()),
    api.app.get("recommendations")
  ]).then(([languagesData, recommendations]) =>
  {
    languages = languagesData;

    for (const recommendation of recommendations)
    {
      let {type} = recommendation;
      const subscription = {
        disabled: true,
        downloadStatus: null,
        homepage: null,
        originalTitle: recommendation.title,
        languages: recommendation.languages,
        recommended: type,
        url: recommendation.url
      };

      if (subscription.recommended != "ads" &&
          subscription.recommended != "circumvention")
      {
        type = type.replace(/\W/g, "_");
        subscription.title = getMessage(`common_feature_${type}_title`);
      }

      addSubscription(subscription);
    }
  });
}

function findParentData(element, dataName, returnElement)
{
  element = element.closest(`[data-${dataName}]`);
  if (!element)
    return null;
  if (returnElement)
    return element;
  return element.getAttribute(`data-${dataName}`);
}

function sendMessageHandleErrors(message, onSuccess)
{
  browser.runtime.sendMessage(message).then(errors =>
  {
    if (errors.length > 0)
    {
      errors = errors.map(getErrorMessage);
      alert(errors.join("\n"));
    }
    else if (onSuccess)
      onSuccess();
  });
}

function switchTab(id)
{
  location.hash = id;
}

function execAction(action, element)
{
  if (element.getAttribute("aria-disabled") == "true")
    return;

  switch (action)
  {
    case "add-domain-exception":
      addWhitelistedDomain();
      break;
    case "add-language-subscription":
      addEnableSubscription(findParentData(element, "access", false));
      break;
    case "add-predefined-subscription": {
      const dialog = $("#dialog-content-predefined");
      const title = dialog.querySelector("h3").textContent;
      const url = dialog.querySelector(".url").textContent;
      addEnableSubscription(url, title);
      closeDialog();
      break;
    }
    case "change-language-subscription":
      changeLanguageSubscription(findParentData(element, "access", false));
      break;
    case "close-dialog":
      closeDialog();
      break;
    case "hide-more-filters-section":
      $("#more-filters").setAttribute("aria-hidden", true);
      break;
    case "hide-notification":
      hideNotification();
      break;
    case "import-subscription": {
      const url = $("#blockingList-textbox").value;
      addEnableSubscription(url);
      closeDialog();
      break;
    }
    case "open-dialog": {
      const dialog = findParentData(element, "dialog", false);
      openDialog(dialog);
      break;
    }
    case "open-list-box":
      const ioListBox = $("io-list-box");
      ioListBox.change = true;
      $("button", ioListBox).focus();
      break;
    case "remove-filter":
      browser.runtime.sendMessage({
        type: "filters.remove",
        text: findParentData(element, "access", false)
      });
      break;
    case "remove-subscription":
      browser.runtime.sendMessage({
        type: "subscriptions.remove",
        url: findParentData(element, "access", false)
      });
      break;
    case "show-more-filters-section":
      $("#more-filters").setAttribute("aria-hidden", false);
      break;
    case "switch-acceptable-ads":
      const value = element.value || element.dataset.value;
      // User check the checkbox
      const shouldCheck = element.getAttribute("aria-checked") != "true";
      let installAcceptableAds = false;
      let installAcceptableAdsPrivacy = false;
      // Acceptable Ads checkbox clicked
      if (value == "ads")
      {
        installAcceptableAds = shouldCheck;
      }
      // Privacy Friendly Acceptable Ads checkbox clicked
      else
      {
        installAcceptableAdsPrivacy = shouldCheck;
        installAcceptableAds = !shouldCheck;
      }

      browser.runtime.sendMessage({
        type: installAcceptableAds ? "subscriptions.add" :
          "subscriptions.remove",
        url: acceptableAdsUrl
      });
      browser.runtime.sendMessage({
        type: installAcceptableAdsPrivacy ? "subscriptions.add" :
          "subscriptions.remove",
        url: acceptableAdsPrivacyUrl
      });
      break;
    case "switch-tab":
      switchTab(element.getAttribute("href").substr(1));
      break;
    case "toggle-disable-subscription":
      browser.runtime.sendMessage({
        type: "subscriptions.toggle",
        keepInstalled: true,
        url: findParentData(element, "access", false)
      });
      break;
    case "toggle-pref":
      browser.runtime.sendMessage({
        type: "prefs.toggle",
        key: findParentData(element, "pref", false)
      });
      break;
    case "toggle-remove-subscription":
      const subscriptionUrl = findParentData(element, "access", false);
      if (element.getAttribute("aria-checked") == "true")
      {
        browser.runtime.sendMessage({
          type: "subscriptions.remove",
          url: subscriptionUrl
        });
      }
      else
        addEnableSubscription(subscriptionUrl);
      break;
    case "update-all-subscriptions":
      browser.runtime.sendMessage({
        type: "subscriptions.update"
      });
      break;
    case "update-subscription":
      browser.runtime.sendMessage({
        type: "subscriptions.update",
        url: findParentData(element, "access", false)
      });
      break;
    case "validate-import-subscription":
      const form = findParentData(element, "validation", true);
      if (!form)
        return;

      if (form.checkValidity())
      {
        addEnableSubscription($("#import-list-url").value);
        form.reset();
        closeDialog();
      }
      else
      {
        form.querySelector(":invalid").focus();
      }
      break;
  }
}

function changeLanguageSubscription(url)
{
  for (const key in subscriptionsMap)
  {
    const subscription = subscriptionsMap[key];
    const subscriptionType = subscription.recommended;
    if (subscriptionType == "ads" && subscription.disabled == false)
    {
      browser.runtime.sendMessage({
        type: "subscriptions.remove",
        url: subscription.url
      });
      browser.runtime.sendMessage({
        type: "subscriptions.add",
        url
      });
      break;
    }
  }
}

function onClick(e)
{
  let actions = findParentData(e.target, "action", false);
  if (!actions)
    return;

  actions = actions.split(",");
  for (const action of actions)
  {
    execAction(action, e.target);
  }
}

function onKeyUp(e)
{
  const key = events.key(e);
  let element = document.activeElement;
  if (!key || !element)
    return;

  const container = findParentData(element, "action", true);
  if (!container || !container.hasAttribute("data-keys"))
    return;

  const keys = container.getAttribute("data-keys").split(" ");
  if (keys.indexOf(key) < 0)
    return;

  if (element.getAttribute("role") == "tab")
  {
    let parent = element.parentElement;
    if (key == "ArrowLeft" || key == "ArrowUp")
      parent = parent.previousElementSibling || container.lastElementChild;
    else if (key == "ArrowRight" || key == "ArrowDown")
      parent = parent.nextElementSibling || container.firstElementChild;
    element = parent.firstElementChild;
  }

  const actions = container.getAttribute("data-action").split(",");
  for (const action of actions)
  {
    execAction(action, element);
  }
}

function selectTabItem(tabId, container, focus)
{
  // Show tab content
  document.body.setAttribute("data-tab", tabId);

  // Select tab
  const tabList = container.querySelector("[role='tablist']");
  if (!tabList)
    return null;

  const previousTab = tabList.querySelector("[aria-selected]");
  previousTab.removeAttribute("aria-selected");
  previousTab.setAttribute("tabindex", -1);

  const tab = tabList.querySelector("a[href='#" + tabId + "']");
  tab.setAttribute("aria-selected", true);
  tab.setAttribute("tabindex", 0);

  const tabContentId = tab.getAttribute("aria-controls");
  const tabContent = document.getElementById(tabContentId);

  if (tab && focus)
    tab.focus();

  return tabContent;
}

function onHashChange()
{
  const hash = location.hash.substr(1);
  if (!hash)
    return;

  // Select tab and parent tabs
  const tabIds = hash.split("-");
  let tabContent = document.body;
  for (let i = 0; i < tabIds.length; i++)
  {
    const tabId = tabIds.slice(0, i + 1).join("-");
    tabContent = selectTabItem(tabId, tabContent, true);
    if (!tabContent)
      break;
  }
}

function setupIoListBox()
{
  const ioListBox = $("io-list-box");
  ioListBox.getItemTitle = getLanguageTitle;
  ioListBox.placeholder = getMessage("options_dialog_language_title");
  ioListBox.items = collections.allLangs.items;
  ioListBox.addEventListener("close", (event) =>
  {
    ioListBox.change = false;
  });
  ioListBox.addEventListener("change", (event) =>
  {
    const item = event.detail;
    if (ioListBox.change)
      changeLanguageSubscription(item.url);
    else
    {
      item.disabled = !item.disabled;
      addEnableSubscription(item.url, item.originalTitle, item.homepage);
    }
  });
}

function onDOMLoaded()
{
  populateLists().then(setupIoListBox);

  // Initialize navigation sidebar
  browser.runtime.sendMessage({
    type: "app.get",
    what: "addonVersion"
  }).then(addonVersion =>
  {
    $("#abp-version").textContent = getMessage("options_dialog_about_version",
      [addonVersion]);
  });

  // Initialize interactive UI elements
  document.body.addEventListener("click", onClick, false);
  document.body.addEventListener("keyup", onKeyUp, false);
  const exampleValue = getMessage("options_whitelist_placeholder_example",
    ["www.example.com"]);
  $("#whitelisting-textbox").setAttribute("placeholder", exampleValue);
  $("#whitelisting-textbox").addEventListener("keyup", (e) =>
  {
    $("#whitelisting-add-button").disabled = !e.target.value;
  }, false);

  // General tab
  getDocLink("contribute").then(link =>
  {
    $("#contribute").href = link;
  });
  getDocLink("acceptable_ads_criteria").then(link =>
  {
    setElementLinks("enable-acceptable-ads-description", link);
  });
  getDocLink("imprint").then((url) =>
  {
    setElementText(
      $("#copyright"),
      "options_dialog_about_copyright",
      [new Date().getFullYear()]
    );
    setElementLinks("copyright", url);
  });
  getDocLink("privacy").then((url) =>
  {
    $("#privacy-policy").href = url;
  });
  setElementText($("#tracking-warning-1"), "options_tracking_warning_1",
    [getMessage("common_feature_privacy_title"),
     getMessage("options_acceptableAds_ads_label")]);
  setElementText($("#tracking-warning-3"), "options_tracking_warning_3",
    [getMessage("options_acceptableAds_privacy_label")]);

  getDocLink("privacy_friendly_ads").then(link =>
  {
    $("#enable-acceptable-ads-privacy-description").href = link;
  });
  getDocLink("adblock_plus_{browser}_dnt").then(url =>
  {
    setElementLinks("dnt", url);
  });

  // Whitelisted tab
  getDocLink("whitelist").then(link =>
  {
    $("#whitelist-learn-more").href = link;
  });

  // Advanced tab
  let customize = document.querySelectorAll("#customize li[data-pref]");
  customize = Array.prototype.map.call(customize, (checkbox) =>
  {
    return checkbox.getAttribute("data-pref");
  });
  for (const key of customize)
  {
    getPref(key).then((value) =>
    {
      onPrefMessage(key, value, true);
    });
  }
  browser.runtime.sendMessage({
    type: "app.get",
    what: "features"
  }).then(features =>
  {
    hidePref("show_devtools_panel", !features.devToolsPanel);
  });

  getDocLink("filterdoc").then(link =>
  {
    setElementLinks("custom-filters-description", link);
  });

  getDocLink("subscriptions").then(link =>
  {
    $("#filter-lists-learn-more").setAttribute("href", link);
  });

  // Help tab
  getDocLink("help_center_abp_en", (link) =>
  {
    setElementLinks("help-center", link);
  });
  getDocLink("adblock_plus_report_bug", (link) =>
  {
    setElementLinks("report-bug", link);
  });
  getDocLink("{browser}_support").then(url =>
  {
    setElementLinks("visit-forum", url);
  });
  getDocLink("social_twitter").then(link =>
  {
    $("#social .twitter").setAttribute("href", link);
  });
  getDocLink("social_facebook").then(link =>
  {
    $("#social .facebook").setAttribute("href", link);
  });
  getDocLink("social_weibo").then(link =>
  {
    $("#social .weibo").setAttribute("href", link);
  });

  $("#dialog").addEventListener("keydown", function(e)
  {
    switch (events.key(e))
    {
      case "Escape":
        closeDialog();
        break;
      case "Tab":
        if (e.shiftKey)
        {
          if (e.target.classList.contains("focus-first"))
          {
            e.preventDefault();
            this.querySelector(".focus-last").focus();
          }
        }
        else if (e.target.classList.contains("focus-last"))
        {
          e.preventDefault();
          this.querySelector(".focus-first").focus();
        }
        break;
    }
  }, false);

  onHashChange();
}

let focusedBeforeDialog = null;
function openDialog(name)
{
  const dialog = $("#dialog");
  dialog.setAttribute("aria-hidden", false);
  dialog.setAttribute("aria-labelledby", "dialog-title-" + name);
  document.body.setAttribute("data-dialog", name);

  let defaultFocus = document.querySelector(
    "#dialog-content-" + name + " .default-focus"
  );
  if (!defaultFocus)
    defaultFocus = dialog.querySelector(".focus-first");
  focusedBeforeDialog = document.activeElement;
  defaultFocus.focus();
}

function closeDialog()
{
  const dialog = $("#dialog");
  dialog.setAttribute("aria-hidden", true);
  dialog.removeAttribute("aria-labelledby");
  document.body.removeAttribute("data-dialog");
  focusedBeforeDialog.focus();
}

function showNotification(text)
{
  $("#notification").setAttribute("aria-hidden", false);
  $("#notification-text").textContent = text;
  setTimeout(hideNotification, 3000);
}

function hideNotification()
{
  $("#notification").setAttribute("aria-hidden", true);
  $("#notification-text").textContent = "";
}

function setAcceptableAds()
{
  const acceptableAdsForm = $("#acceptable-ads");
  const acceptableAds = $("#acceptable-ads-allow");
  const acceptableAdsPrivacy = $("#acceptable-ads-privacy-allow");
  acceptableAdsForm.classList.remove("show-dnt-notification");
  acceptableAds.setAttribute("aria-checked", false);
  acceptableAdsPrivacy.setAttribute("aria-checked", false);
  acceptableAdsPrivacy.setAttribute("tabindex", 0);
  if (acceptableAdsUrl in subscriptionsMap &&
      !subscriptionsMap[acceptableAdsUrl].disabled)
  {
    acceptableAds.setAttribute("aria-checked", true);
    acceptableAdsPrivacy.setAttribute("aria-disabled", false);
  }
  else if (acceptableAdsPrivacyUrl in subscriptionsMap &&
          !subscriptionsMap[acceptableAdsPrivacyUrl].disabled)
  {
    acceptableAds.setAttribute("aria-checked", true);
    acceptableAdsPrivacy.setAttribute("aria-checked", true);
    acceptableAdsPrivacy.setAttribute("aria-disabled", false);

    // Edge uses window instead of navigator.
    // Prefer navigator first since it's the standard.
    if ((navigator.doNotTrack || window.doNotTrack) != 1)
      acceptableAdsForm.classList.add("show-dnt-notification");
  }
  else
  {
    // Using aria-disabled in order to keep the focus
    acceptableAdsPrivacy.setAttribute("aria-disabled", true);
    acceptableAdsPrivacy.setAttribute("tabindex", -1);
  }
}

function isAcceptableAds(url)
{
  return url == acceptableAdsUrl || url == acceptableAdsPrivacyUrl;
}

function hasPrivacyConflict()
{
  const acceptableAdsList = subscriptionsMap[acceptableAdsUrl];
  let privacyList = null;
  for (const url in subscriptionsMap)
  {
    const subscription = subscriptionsMap[url];
    if (subscription.recommended == "privacy")
    {
      privacyList = subscription;
      break;
    }
  }
  return acceptableAdsList && acceptableAdsList.disabled == false &&
    privacyList && privacyList.disabled == false;
}

function setPrivacyConflict()
{
  const acceptableAdsForm = $("#acceptable-ads");
  if (hasPrivacyConflict())
  {
    getPref("ui_warn_tracking").then((showTrackingWarning) =>
    {
      acceptableAdsForm.classList.toggle("show-warning", showTrackingWarning);
    });
  }
  else
  {
    acceptableAdsForm.classList.remove("show-warning");
  }
}

function populateLists()
{
  return new Promise(resolve =>
  {
    let todo = 2;
    const done = () =>
    {
      if (!--todo)
        resolve();
    };

    subscriptionsMap = Object.create(null);
    filtersMap = Object.create(null);

    // Empty collections and lists
    for (const property in collections)
      collections[property].clearAll();

    browser.runtime.sendMessage({
      type: "subscriptions.get",
      special: true
    }).then((subscriptions) =>
    {
      const customFilterPromises = subscriptions.map(getSubscriptionFilters);
      Promise.all(customFilterPromises).then((filters) =>
      {
        loadCustomFilters([].concat(...filters));
        isCustomFiltersLoaded = true;
      }).then(done);
    });

    Promise.all([
      browser.runtime.sendMessage({
        type: "prefs.get",
        key: "subscriptions_exceptionsurl"
      }),
      browser.runtime.sendMessage({
        type: "prefs.get",
        key: "subscriptions_exceptionsurl_privacy"
      }),
      getPref("additional_subscriptions"),
      browser.runtime.sendMessage({
        type: "subscriptions.get",
        downloadable: true
      })
    ])
    .then(([url, privacyUrl, additionalSubscriptionUrls, subscriptions]) =>
    {
      acceptableAdsUrl = url;
      acceptableAdsPrivacyUrl = privacyUrl;
      additionalSubscriptions = additionalSubscriptionUrls;

      for (const subscription of subscriptions)
        onSubscriptionMessage("added", subscription);

      setAcceptableAds();
      done();
    });
  });
}

function addWhitelistedDomain()
{
  const domain = $("#whitelisting-textbox");
  for (const whitelistItem of collections.whitelist.items)
  {
    if (whitelistItem.title == domain.value)
    {
      whitelistItem[timestampUI] = Date.now();
      collections.whitelist.updateItem(whitelistItem);
      domain.value = "";
      break;
    }
  }
  const value = domain.value.trim();
  if (value)
  {
    const host = /^https?:\/\//i.test(value) ? new URL(value).host : value;
    sendMessageHandleErrors({
      type: "filters.add",
      text: "@@||" + host.toLowerCase() + "^$document"
    });
  }

  domain.value = "";
  $("#whitelisting-add-button").disabled = true;
}

function addEnableSubscription(url, title, homepage)
{
  let messageType = null;
  const knownSubscription = subscriptionsMap[url];
  if (knownSubscription && knownSubscription.disabled == true)
    messageType = "subscriptions.toggle";
  else
    messageType = "subscriptions.add";

  const message = {
    type: messageType,
    url
  };
  if (title)
    message.title = title;
  if (homepage)
    message.homepage = homepage;

  browser.runtime.sendMessage(message);
}

function onFilterMessage(action, filter)
{
  switch (action)
  {
    case "added":
      filter[timestampUI] = Date.now();
      updateFilter(filter);
      break;
    case "loaded":
      populateLists();
      break;
    case "removed":
      const knownFilter = filtersMap[filter.text];
      if (whitelistedDomainRegexp.test(knownFilter.text))
        collections.whitelist.removeItem(knownFilter);
      else
        removeCustomFilter(filter.text);

      delete filtersMap[filter.text];
      break;
  }
}

function onSubscriptionMessage(action, subscription)
{
  // Ensure that recommendations have already been loaded so that we can
  // identify and handle recommended filter lists accordingly (see #6838)
  promisedRecommendationsLoaded.then(() =>
  {
    if (subscription.url in subscriptionsMap)
    {
      const knownSubscription = subscriptionsMap[subscription.url];
      for (const property in subscription)
      {
        if (property == "title" && knownSubscription.recommended)
          knownSubscription.originalTitle = subscription.title;
        else
          knownSubscription[property] = subscription[property];
      }
      subscription = knownSubscription;
    }

    switch (action)
    {
      case "disabled":
        updateSubscription(subscription);
        if (isAcceptableAds(subscription.url))
          setAcceptableAds();

        setPrivacyConflict();
        break;
      case "downloading":
      case "downloadStatus":
      case "homepage":
      case "lastDownload":
      case "title":
        updateSubscription(subscription);
        break;
      case "added":
        const {url} = subscription;
        // Handle custom subscription
        if (/^~user/.test(url))
        {
          loadCustomFilters(subscription.filters);
          return;
        }
        else if (url in subscriptionsMap)
          updateSubscription(subscription);
        else
          addSubscription(subscription);

        if (isAcceptableAds(url))
          setAcceptableAds();

        collections.filterLists.addItem(subscription);
        setPrivacyConflict();
        break;
      case "removed":
        if (subscription.recommended)
        {
          subscription.disabled = true;
          onSubscriptionMessage("disabled", subscription);
        }
        else
        {
          delete subscriptionsMap[subscription.url];
          if (isAcceptableAds(subscription.url))
          {
            setAcceptableAds();
          }
          else
          {
            collections.more.removeItem(subscription);
          }
        }

        collections.filterLists.removeItem(subscription);
        setPrivacyConflict();
        break;
    }
  });
}

function getSubscriptionFilters(subscription)
{
  return browser.runtime.sendMessage({
    type: "filters.get",
    subscriptionUrl: subscription.url});
}

function hidePref(key, value)
{
  const element = getPrefElement(key);
  if (element)
    element.setAttribute("aria-hidden", value);
}

function getPrefElement(key)
{
  return document.querySelector("[data-pref='" + key + "']");
}

function getPref(key)
{
  return browser.runtime.sendMessage({
    type: "prefs.get",
    key
  });
}

function onPrefMessage(key, value, initial)
{
  switch (key)
  {
    case "notifications_ignoredcategories":
      value = value.indexOf("*") == -1;
      break;
    case "ui_warn_tracking":
      setPrivacyConflict();
      break;
  }

  const checkbox = document.querySelector(
    "[data-pref='" + key + "'] button[role='checkbox']"
  );
  if (checkbox)
    checkbox.setAttribute("aria-checked", value);
}

port.onMessage.addListener((message) =>
{
  switch (message.type)
  {
    case "app.respond":
      switch (message.action)
      {
        case "addSubscription":
          const subscription = message.args[0];
          const dialog = $("#dialog-content-predefined");

          let {title, url} = subscription;
          if (!title || title == url)
          {
            title = "";
          }

          dialog.querySelector("h3").textContent = title;
          dialog.querySelector(".url").textContent = url;
          openDialog("predefined");
          break;
        case "focusSection":
          let section = message.args[0];
          if (section == "notifications")
          {
            section = "advanced";
            const elem = getPrefElement("notifications_ignoredcategories");
            elem.classList.add("highlight-animate");
            elem.querySelector("button").focus();
          }

          selectTabItem(section, document.body, false);
          break;
      }
      break;
    case "filters.respond":
      onFilterMessage(message.action, message.args[0]);
      break;
    case "prefs.respond":
      onPrefMessage(message.action, message.args[0], false);
      break;
    case "subscriptions.respond":
      onSubscriptionMessage(message.action, message.args[0]);
      break;
  }
});

port.postMessage({
  type: "app.listen",
  filter: ["addSubscription", "focusSection"]
});
port.postMessage({
  type: "filters.listen",
  filter: ["added", "loaded", "removed"]
});
port.postMessage({
  type: "prefs.listen",
  filter: [
    "notifications_ignoredcategories",
    "notifications_showui",
    "shouldShowBlockElementMenu",
    "show_devtools_panel",
    "show_statsinicon",
    "ui_warn_tracking"
  ]
});
port.postMessage({
  type: "subscriptions.listen",
  filter: ["added", "disabled", "homepage", "lastDownload", "removed",
           "title", "downloadStatus", "downloading"]
});

onDOMLoaded();

// We must call port.disconnect because of this Microsoft Edge bug:
// https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/19011773/
window.addEventListener("unload", () => port.disconnect());
window.addEventListener("hashchange", onHashChange, false);
