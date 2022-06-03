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

import {
  closeAddFiltersByURL,
  setupAddFiltersByURL
} from "./add-filters-by-url";
import {
  getPrettyItemTitle,
  getRawItemTitle,
  loadLanguageNames
} from "./titles";
import api from "../../api";
import {convertDoclinks, getDoclink, getErrorMessage} from "../../common";
import {$, $$} from "../../dom";
import {
  initI18n,
  setElementLinks,
  setElementText,
  stripTagsUnsafe
} from "../../i18n";

import "../../io-filter-table";
import "../../io-list-box";
import "../../io-popout";
import "../../io-toggle";

const ALLOWED_PROTOCOLS = /^(?:data|https):/;

let subscriptionsMap = Object.create(null);
let filtersMap = Object.create(null);
let acceptableAdsUrl = null;
let acceptableAdsPrivacyUrl = null;
let isCustomFiltersLoaded = false;
let additionalSubscriptions = [];

const collections = Object.create(null);
const {getMessage} = browser.i18n;
const customFilters = [];
const syncErrorIds = new Map([
  ["synchronize_invalid_url",
   "options_filterList_lastDownload_invalidURL"],
  ["synchronize_connection_error",
   "options_filterList_lastDownload_connectionError"],
  ["synchronize_invalid_data",
   "options_filterList_lastDownload_invalidData"],
  ["synchronize_checksum_mismatch",
   "options_filterList_lastDownload_checksumMismatch"]
]);
const filtersDisabledErrorId = "options_filterList_filtersDisabled";
const subscriptionErrorIds = new Map();
const timestampUI = Symbol();
const allowlistedDomainRegexp = /^@@\|\|([^/:]+)\^\$document$/;
const allowlistedPageRegexp = /^@@\|([^?|]+(?:\?[^|]*)?)\|?\$document$/;
// Period of time in milliseconds
const minuteInMs = 60000;
const hourInMs = 3600000;
const fullDayInMs = 86400000;

convertDoclinks();
initI18n();

const promisedLocaleInfo = browser.runtime.sendMessage({
  type: "app.get",
  what: "localeInfo"
});
const promisedDateFormat = promisedLocaleInfo.then((addonLocale) =>
{
  return new Intl.DateTimeFormat(addonLocale.locale);
}).catch(dispatchError);
const promisedResources = loadResources();

function Collection(details)
{
  this.details = details;
  this.items = [];
}

Collection.prototype._setEmpty = function(table, detail, removeEmpty)
{
  if (removeEmpty)
  {
    const placeholders = $$(".empty-placeholder", table);
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
    return $(`[data-access="${access}"]`, container);
  };
};

Collection.prototype._getItemTitle = function(item, i)
{
  if (this.details[i].getItemTitle)
    return this.details[i].getItemTitle(item);

  return getRawItemTitle(item);
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
    const template = $("template", table);
    const listItem = document.createElement("li");
    listItem.appendChild(document.importNode(template.content, true));
    listItem.setAttribute("aria-label", this._getItemTitle(item, j));
    listItem.setAttribute("data-recommended", item.recommended);
    listItem.setAttribute("data-access", item.url || item.text);
    listItem.setAttribute("role", "section");

    const tooltip = $("io-popout[type='tooltip']", listItem);
    if (tooltip)
    {
      let tooltipId = tooltip.dataset.templateI18nBody;
      tooltipId = tooltipId.replace("%value%", item.recommended);
      if (getMessage(tooltipId))
      {
        tooltip.setAttribute("i18n-body", tooltipId);
      }
      if (item.recommended === "cookies")
      {
        tooltip.dataset.i18nDoclinks = "block_cookie_warnings";
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
    const control = $(".control", element);
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
  if (oldIndex === -1)
    return;

  this._sortItems();
  const access = (item.url || item.text).replace(/'/g, "\\'");
  for (let i = 0; i < this.details.length; i++)
  {
    const table = $(`#${this.details[i].id}`);
    const element = $(`[data-access="${access}"]`, table);
    const title = this._getItemTitle(item, i);
    const displays = $$("[data-display]", element);
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

    const controls = $$(
      `.control[role='checkbox'],
      io-toggle.control`,
      element
    );
    for (const control of controls)
    {
      const checked = !item.disabled;
      if (control.matches("io-toggle"))
        control.checked = checked;
      else
        control.setAttribute("aria-checked", checked);
      if (isAcceptableAds(item.url) && this == collections.filterLists)
      {
        control.disabled = true;
        control.setAttribute("aria-hidden", true);
      }
    }
    if (additionalSubscriptions.includes(item.url))
    {
      element.classList.add("preconfigured");
      const disablePreconfigures =
        $$("[data-disable~='preconfigured']", element);
      for (const disablePreconfigure of disablePreconfigures)
        disablePreconfigure.disabled = true;
    }

    const lastUpdateElement = $(".last-update", element);
    if (lastUpdateElement)
    {
      element.classList.remove("show-message");
      cleanSyncErrorIdsFromSubscription(item.url);
      if (item.downloading)
      {
        const text = getMessage("options_filterList_lastDownload_inProgress");
        $(".message", element).textContent = text;
        element.classList.add("show-message");
      }
      else if (item.downloadStatus != "synchronize_ok")
      {
        // Core doesn't tell us why the URL is invalid so we have to check
        // ourselves whether the filter list is using a supported protocol
        // https://gitlab.com/eyeo/adblockplus/adblockpluscore/blob/d3f6b1b7e3880eab6356b132493a4a947c87d33f/lib/downloader.js#L270
        if (item.downloadStatus === "synchronize_invalid_url" &&
            !ALLOWED_PROTOCOLS.test(item.url))
        {
          addErrorIdToSubscription(
            item.url,
            "options_filterList_lastDownload_invalidURLProtocol"
          );
        }
        else
        {
          const errorId = syncErrorIds.get(item.downloadStatus) ||
                          item.downloadStatus;
          if (errorId)
            addErrorIdToSubscription(item.url, errorId);
        }
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
      }

      updateErrorTooltip(element, subscriptionErrorIds.get(item.url));
    }

    const websiteElement = $("io-popout .website", element);
    if (websiteElement)
    {
      if (item.homepage)
        websiteElement.setAttribute("href", item.homepage);
      websiteElement.setAttribute("aria-hidden", !item.homepage);
    }

    const sourceElement = $("io-popout .source", element);
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
  let focusables = $$("a, button, input, .control", container);
  focusables = Array.prototype.slice.call(focusables);
  let index = focusables.indexOf(currentElement);
  index += (index == focusables.length - 1) ? -1 : 1;

  const nextElement = focusables[index];
  if (!nextElement)
    return false;

  nextElement.focus();
  return true;
}

collections.recommendedList = new Collection([
  {
    id: "recommended-list-table",
    getItemTitle: (item) => getPrettyItemTitle(item, false)
  }
]);
collections.langs = new Collection([
  {
    id: "blocking-languages-table",
    emptyTexts: ["options_language_empty"],
    getItemTitle: (item) => getPrettyItemTitle(item, false)
  }
]);
collections.more = new Collection([
  {
    id: "more-list-table",
    setEmptyAction: "hide-more-filters-section",
    removeEmptyAction: "show-more-filters-section"
  }
]);
collections.allowlist = new Collection([
  {
    id: "allowlisting-table",
    emptyTexts: ["options_allowlist_empty_1", "options_allowlist_empty_2"]
  }
]);
collections.filterLists = new Collection([
  {
    id: "all-filter-lists-table",
    emptyTexts: ["options_filterList_empty"]
  }
]);

function addSubscription(subscription)
{
  const {disabled, recommended, url} = subscription;
  let collection = null;
  switch (recommended)
  {
    case "ads":
      if (disabled == false)
        collection = collections.langs;

      const ioListBox = $("#languages-box");
      ioListBox.items = ioListBox.items.concat(subscription);
      break;
    case "cookies":
    case "notifications":
    case "privacy":
    case "social":
      collection = collections.recommendedList;
      break;
    default:
      if (typeof recommended === "undefined" &&
          !isAcceptableAds(url) &&
          disabled == false)
        collection = collections.more;
      break;
  }

  if (collection)
  {
    collection.addItem(subscription);
  }

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
  let allowlistTitle = null;

  const domainMatch = filter.text.match(allowlistedDomainRegexp);
  if (domainMatch && !filtersMap[filter.text])
  {
    allowlistTitle = domainMatch[1];
  }
  else
  {
    const pageMatch = filter.text.match(allowlistedPageRegexp);
    if (pageMatch && !filtersMap[filter.text])
    {
      const url = pageMatch[1];
      allowlistTitle = url.replace(/^[\w-]+:\/+(?:www\.)?/, "");
      if (/\?$/.test(allowlistTitle))
      {
        allowlistTitle += "…";
      }
    }
  }

  if (allowlistTitle)
  {
    filter.title = allowlistTitle;
    collections.allowlist.addItem(filter);
    if (isCustomFiltersLoaded)
    {
      const text = getMessage("options_allowlist_notification", [filter.title]);
      showNotification(text, "info");
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

async function loadResources()
{
  const subscriptions = [];

  try
  {
    await loadLanguageNames();

    const recommendations = await api.app.get("recommendations");
    for (const recommendation of recommendations)
    {
      const subscription = {
        disabled: true,
        downloadStatus: null,
        homepage: null,
        languages: recommendation.languages,
        recommended: recommendation.type,
        title: recommendation.title,
        url: recommendation.url
      };

      subscriptions.push(subscription);
      addSubscription(subscription);
    }
  }
  catch (ex)
  {
    dispatchError(ex);
  }

  return {recommendations: subscriptions};
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
      alert(stripTagsUnsafe(errors.join("\n")));
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
    return false;

  switch (action)
  {
    case "add-domain-exception":
      addAllowlistedDomain();
      return true;
    case "add-language-subscription":
      addEnableSubscription(findParentData(element, "access", false));
      return true;
    case "add-predefined-subscription": {
      const dialog = $("#dialog-content-predefined");
      const title = $(".title > span", dialog).textContent;
      const url = $(".url > a", dialog).textContent;
      addEnableSubscription(url, title);
      closeDialog();
      return true;
    }
    case "change-language-subscription":
      changeLanguageSubscription(findParentData(element, "access", false));
      return true;
    case "close-dialog":
      closeDialog();
      return true;
    case "hide-more-filters-section":
      $("#more-filters").setAttribute("aria-hidden", true);
      return true;
    case "hide-acceptable-ads-survey":
      $("#acceptable-ads-why-not").setAttribute("aria-hidden", true);
      return false;
    case "hide-notification":
      hideNotification();
      return true;
    case "import-subscription": {
      const url = $("#blockingList-textbox").value;
      addEnableSubscription(url);
      closeDialog();
      return true;
    }
    case "open-dialog": {
      const dialog = findParentData(element, "dialog", false);
      openDialog(dialog);
      return true;
    }
    case "close-filterlist-by-url":
      closeAddFiltersByURL();
      return true;
    case "open-languages-box":
      const ioListBox = $("#languages-box");
      ioListBox.swap = true;
      $("button", ioListBox).focus();
      return true;
    case "remove-filter":
      browser.runtime.sendMessage({
        type: "filters.remove",
        text: findParentData(element, "access", false)
      });
      return true;
    case "remove-subscription":
      browser.runtime.sendMessage({
        type: "subscriptions.remove",
        url: findParentData(element, "access", false)
      });
      return true;
    case "show-more-filters-section":
      $("#more-filters").setAttribute("aria-hidden", false);
      return true;
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
      return true;
    case "switch-tab":
      switchTab(element.getAttribute("href").substr(1));
      return true;
    case "enable-filters":
      const url = findParentData(element, "access", false);
      const subscription = subscriptionsMap[url];
      browser.runtime.sendMessage({
        type: "subscriptions.enableAllFilters",
        url
      }).then(() => updateSubscription(subscription));
      return true;
    case "toggle-disable-subscription":
      browser.runtime.sendMessage({
        type: "subscriptions.toggle",
        keepInstalled: true,
        url: findParentData(element, "access", false)
      });
      return true;
    case "toggle-pref":
      browser.runtime.sendMessage({
        type: "prefs.toggle",
        key: findParentData(element, "pref", false)
      });
      return true;
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
      return true;
    case "update-all-subscriptions":
      browser.runtime.sendMessage({
        type: "subscriptions.update"
      });
      return true;
    case "update-subscription":
      browser.runtime.sendMessage({
        type: "subscriptions.update",
        url: findParentData(element, "access", false)
      });
      return true;
    case "validate-import-subscription":
      const form = findParentData(element, "validation", true);
      if (!form)
        return;

      if (form.checkValidity())
      {
        addEnableSubscription($("#import-list-url", form).value);
        form.reset();
        closeAddFiltersByURL();
      }
      else
      {
        $(":invalid", form).focus();
      }
      return true;
  }

  return false;
}

function execActions(actions, element)
{
  actions = actions.split(",");
  let foundAction = false;

  for (const action of actions)
  {
    foundAction |= execAction(action, element);
  }

  return !!foundAction;
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
  const actions = findParentData(e.target, "action", false);
  if (!actions)
    return;

  const foundAction = execActions(actions, e.target);
  if (foundAction)
  {
    e.preventDefault();
  }
}

function onKeyUp(event)
{
  const {key} = event;
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

  const actions = container.getAttribute("data-action");
  const foundAction = execActions(actions, element);
  if (foundAction)
  {
    event.preventDefault();
  }
}

function selectTabItem(tabId, container, focus)
{
  // Show tab content
  document.body.setAttribute("data-tab", tabId);

  // Select tab
  const tabList = $("[role='tablist']", container);
  if (!tabList)
    return null;

  const previousTab = $("[aria-selected]", tabList);
  previousTab.removeAttribute("aria-selected");
  previousTab.setAttribute("tabindex", -1);

  const tab = $(`a[href="#${tabId}"]`, tabList);
  tab.setAttribute("aria-selected", true);
  tab.setAttribute("tabindex", 0);

  const tabContentId = tab.getAttribute("aria-controls");
  const tabContent = document.getElementById(tabContentId);

  if (tab && focus)
    tab.focus();

  if (tabId === "advanced")
  {
    setupFiltersBox();
    setupAddFiltersByURL();
  }
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

function setupFiltersBox()
{
  const ioListBox = $("#filters-box");

  if (!ioListBox.items.length)
  {
    ioListBox.getItemTitle = (item) => getPrettyItemTitle(item, true);
    ioListBox.addEventListener("change", (event) =>
    {
      const item = event.detail;
      addEnableSubscription(item.url, item.title, item.homepage);
    });
  }

  promisedResources.then(({recommendations}) =>
  {
    ioListBox.items = getListBoxItems(recommendations);
  });
}

function getListBoxItems(subscriptions)
{
  const urls = new Set();
  for (const subscription of collections.filterLists.items)
    urls.add(subscription.url);

  const groups = {
    ads: [],
    others: []
  };

  for (const subscription of subscriptions)
  {
    const {recommended, url} = subscription;
    const key = recommended === "ads" ? recommended : "others";
    const label = getPrettyItemTitle(subscription, true);
    const selected = urls.has(url);
    const overrides = {unselectable: selected, label, selected};
    groups[key].push(Object.assign({}, subscription, overrides));
  }

  // items ordered with groups
  return [
    ...groups.others,
    {
      type: "ads",
      group: true,
      description: browser.i18n.getMessage("options_language_filter_list")
    },
    ...groups.ads
  ];
}

function setupLanguagesBox()
{
  const ioListBox = $("#languages-box");
  ioListBox.getItemTitle = (item) => getPrettyItemTitle(item, false);
  ioListBox.addEventListener("close", (event) =>
  {
    ioListBox.swap = false;
  });
  ioListBox.addEventListener("change", (event) =>
  {
    const item = event.detail;
    if (ioListBox.swap)
      changeLanguageSubscription(item.url);
    else
    {
      item.disabled = !item.disabled;
      addEnableSubscription(item.url, item.title, item.homepage);
    }
  });
}

function onDOMLoaded()
{
  setupLanguagesBox();
  populateLists().catch(dispatchError);
  populateFilters().catch(dispatchError);

  // Initialize navigation sidebar
  browser.runtime.sendMessage({
    type: "app.get",
    what: "addonVersion"
  }).then(addonVersion =>
  {
    $("#abp-version").textContent = getMessage(
      "options_dialog_about_version",
      [addonVersion]
    );
  });

  // Initialize interactive UI elements
  document.body.addEventListener("click", onClick, false);
  document.body.addEventListener("keyup", onKeyUp, false);
  $("#allowlisting-textbox").addEventListener("keyup", (e) =>
  {
    $("#allowlisting-add-button").disabled = !e.target.value;
  }, false);

  $$("li[data-pref]").forEach(async(option) =>
  {
    const key = option.dataset.pref;
    const value = await getPref(key);
    onPrefMessage(key, value, true);
  });

  // General tab
  getDoclink("acceptable_ads_criteria").then(link =>
  {
    setElementLinks("enable-acceptable-ads-description", link);
  });
  getDoclink("imprint").then((url) =>
  {
    setElementText(
      $("#copyright"),
      "options_dialog_about_copyright",
      [new Date().getFullYear()]
    );
    setElementLinks("copyright", url);
  });
  getDoclink("privacy").then((url) =>
  {
    $("#privacy-policy").href = url;
  });
  getDoclink("language_subscription").then((url) =>
  {
    setElementLinks("blocking-languages-description", url);
  });
  setElementText(
    $("#tracking-warning-1"),
    "options_tracking_warning_1",
    [
      getMessage("common_feature_privacy_title"),
      getMessage("options_acceptableAds_ads_label")
    ]
  );
  setElementText(
    $("#tracking-warning-3"),
    "options_tracking_warning_3",
    [getMessage("options_acceptableAds_privacy_label")]
  );

  getDoclink("adblock_plus_{browser}_dnt").then(url =>
  {
    setElementLinks("dnt", url);
  });
  getDoclink("acceptable_ads_survey").then(url =>
  {
    $("#acceptable-ads-why-not a.primary").href = url;
  });

  // Advanced tab
  browser.runtime.sendMessage({
    type: "app.get",
    what: "features"
  }).then(features =>
  {
    hidePref("show_devtools_panel", !features.devToolsPanel);
  });

  getDoclink("filterdoc").then(link =>
  {
    setElementLinks("custom-filters-description", link);
  });

  // Help tab
  getDoclink("help_center_abp_en").then(link =>
  {
    setElementLinks("help-center", link);
  });
  getDoclink("adblock_plus_report_bug").then(link =>
  {
    setElementLinks("report-bug", link);
  });
  getDoclink("{browser}_support").then(url =>
  {
    setElementLinks("visit-forum", url);
  });

  api.app.getInfo().then(({application, store}) =>
  {
    document.documentElement.dataset.application = application;

    // We need to restrict this feature to certain browsers for which we
    // have a link to where users can rate us
    if (!["chrome", "chromium", "opera", "firefox"].includes(application))
    {
      $("#support-us").setAttribute("aria-hidden", true);
      return;
    }

    api.doclinks.get(`${store}_review`).then((url) =>
    {
      $("#support-us a[data-i18n='options_rating_button']").href = url;
    });
  });

  $("#dialog").addEventListener("keydown", function(event)
  {
    const {key, preventDefault, shiftKey, target} = event;

    switch (key)
    {
      case "Escape":
        closeDialog();
        break;
      case "Tab":
        if (shiftKey)
        {
          if (target.classList.contains("focus-first"))
          {
            preventDefault();
            $(".focus-last", this).focus();
          }
        }
        else if (target.classList.contains("focus-last"))
        {
          preventDefault();
          $(".focus-first", this).focus();
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
  dialog.setAttribute("aria-labelledby", `dialog-title-${name}`);
  dialog.setAttribute("aria-describedby", `dialog-description-${name}`);
  document.body.setAttribute("data-dialog", name);

  let defaultFocus = $(`#dialog-content-${name} .default-focus`);
  if (!defaultFocus)
    defaultFocus = $(".focus-first", dialog);
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

function showNotification(text, kind)
{
  const notification = $("#notification");
  notification.setAttribute("aria-hidden", false);
  $("#notification-text", notification).textContent = text;
  notification.classList.add(kind);
  notification.addEventListener("animationend", hideNotification);
}

function hideNotification()
{
  const notification = $("#notification");
  notification.classList.remove("info", "error");
  notification.setAttribute("aria-hidden", true);
  $("#notification-text", notification).textContent = "";
}

function setAcceptableAds()
{
  const acceptableAdsForm = $("#acceptable-ads");
  const acceptableAds = $("#acceptable-ads-allow");
  const acceptableAdsPrivacy = $("#acceptable-ads-privacy-allow");
  const wasSelected = acceptableAds.getAttribute("aria-checked") === "true";
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

  const isSelected = acceptableAds.getAttribute("aria-checked") === "true";
  const aaSurvey = $("#acceptable-ads-why-not");
  if (isSelected)
  {
    aaSurvey.setAttribute("aria-hidden", true);
  }
  else if (wasSelected)
  {
    aaSurvey.setAttribute("aria-hidden", false);
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

async function populateFilters()
{
  const filters = await api.filters.get();
  loadCustomFilters([].concat(...filters));
  isCustomFiltersLoaded = true;
}

async function populateLists()
{
  subscriptionsMap = Object.create(null);
  filtersMap = Object.create(null);

  // Empty collections and lists
  for (const property in collections)
    collections[property].clearAll();

  const [
    url,
    privacyUrl,
    additionalSubscriptionUrls,
    subscriptions
  ] = await Promise.all([
    api.app.get("acceptableAdsUrl"),
    api.app.get("acceptableAdsPrivacyUrl"),
    api.prefs.get("additional_subscriptions"),
    api.subscriptions.get()
  ]);

  acceptableAdsUrl = url;
  acceptableAdsPrivacyUrl = privacyUrl;
  additionalSubscriptions = additionalSubscriptionUrls;

  for (const subscription of subscriptions)
    onSubscriptionMessage("added", subscription);

  setAcceptableAds();
}

function addAllowlistedDomain()
{
  const domain = $("#allowlisting-textbox");
  const value = domain.value.trim();

  if (!value)
    return;

  for (const allowlistItem of collections.allowlist.items)
  {
    if (allowlistItem.title == value)
    {
      allowlistItem[timestampUI] = Date.now();
      collections.allowlist.updateItem(allowlistItem);
      domain.value = "";
      break;
    }
  }

  try
  {
    const {host} = new URL(/^https?:/.test(value) ? value : `http://${value}`);
    sendMessageHandleErrors({
      type: "filters.add",
      text: "@@||" + host.toLowerCase() + "^$document"
    });
    domain.value = "";
    $("#allowlisting-add-button").disabled = true;
  }
  catch (error)
  {
    dispatchError(error);
  }
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

function cleanSyncErrorIdsFromSubscription(url)
{
  for (const syncErrorId of syncErrorIds.values())
  {
    removeErrorIdFromSubscription(url, syncErrorId);
  }
}

function addErrorIdToSubscription(url, errorId)
{
  let errorIds = subscriptionErrorIds.get(url);

  if (!errorIds)
  {
    errorIds = new Set();
    subscriptionErrorIds.set(url, errorIds);
  }

  errorIds.add(errorId);
}

function removeErrorIdFromSubscription(url, errorId)
{
  const errorIds = subscriptionErrorIds.get(url);

  if (!errorIds)
    return;

  errorIds.delete(errorId);

  if (errorIds.size === 0)
    subscriptionErrorIds.delete(url);
}

function updateErrorTooltip(element, errorIds)
{
  const errorTooltip = $("io-popout[anchor-icon='error']", element);
  const errorList = $(".error-list", errorTooltip);
  errorList.innerHTML = "";

  if (!errorIds || element.classList.contains("show-message"))
  {
    element.classList.remove("error");
    return;
  }

  for (const errorId of errorIds)
  {
    const listItem = document.createElement("li");
    listItem.textContent = getMessage(errorId) || errorId;
    if (errorId === filtersDisabledErrorId)
    {
      const enableFiltersButton = document.createElement("a");
      enableFiltersButton.textContent = getMessage(
        "options_filterList_enableFilters"
      );
      enableFiltersButton.setAttribute("data-action", "enable-filters");
      listItem.appendChild(enableFiltersButton);
    }
    errorList.appendChild(listItem);
  }

  element.classList.add("error");
}

function onFilterMessage(action, filter)
{
  switch (action)
  {
    case "added":
      filter[timestampUI] = Date.now();
      updateFilter(filter);
      break;
    case "removed":
      const knownFilter = filtersMap[filter.text];
      if (allowlistedDomainRegexp.test(knownFilter.text) ||
          allowlistedPageRegexp.test(knownFilter.text))
        collections.allowlist.removeItem(knownFilter);
      else
        removeCustomFilter(filter.text);

      delete filtersMap[filter.text];
      break;
  }
}

function onSubscriptionMessage(action, subscription, ...args)
{
  // Ensure that recommendations have already been loaded so that we can
  // identify and handle recommended filter lists accordingly (see #6838)
  promisedResources.then(() =>
  {
    if (subscription.url in subscriptionsMap)
    {
      const knownSubscription = subscriptionsMap[subscription.url];
      for (const property in subscription)
      {
        knownSubscription[property] = subscription[property];
      }
      subscription = knownSubscription;
    }

    switch (action)
    {
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

        browser.runtime.sendMessage({
          type: "subscriptions.getDisabledFilterCount",
          url: subscription.url
        }).then(disabledFilterCount =>
        {
          if (disabledFilterCount > 0)
            addErrorIdToSubscription(subscription.url, filtersDisabledErrorId);
          collections.filterLists.addItem(subscription);
          setPrivacyConflict();
        });
        break;
      case "changed":
        updateSubscription(subscription);
        if (isAcceptableAds(subscription.url))
          setAcceptableAds();

        setPrivacyConflict();
        break;
      case "filtersDisabled":
        const filtersDisabled = args[0];
        if (filtersDisabled)
          addErrorIdToSubscription(subscription.url, filtersDisabledErrorId);
        else
        {
          removeErrorIdFromSubscription(
            subscription.url,
            filtersDisabledErrorId
          );
        }
        updateSubscription(subscription);
        break;
      case "removed":
        if (subscription.recommended)
        {
          subscription.disabled = true;
          onSubscriptionMessage("changed", subscription);
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

        subscriptionErrorIds.delete(subscription.url);
        collections.filterLists.removeItem(subscription);
        setPrivacyConflict();
        break;
    }
  }).catch(dispatchError);
}

function hidePref(key, value)
{
  const element = getPrefElement(key);
  if (element)
    element.setAttribute("aria-hidden", value);
}

function getPrefElement(key)
{
  return $(`[data-pref="${key}"]`);
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

  const checkbox = $(`[data-pref="${key}"] button[role="checkbox"]`);
  if (checkbox)
    checkbox.setAttribute("aria-checked", value);
}

api.port.onMessage.addListener((message) =>
{
  switch (message.type)
  {
    case "app.respond":
      switch (message.action)
      {
        case "addSubscription":
          const subscription = message.args[0];

          let {title, url} = subscription;
          if (!title || title == url)
          {
            title = "";
          }

          if (ALLOWED_PROTOCOLS.test(url))
          {
            const dialog = $("#dialog-content-predefined");
            $(".title > span", dialog).textContent = title;
            $(".title", dialog).hidden = !title;
            const link = $(".url > a", dialog);
            link.href = url;
            link.textContent = url;
            openDialog("predefined");
          }
          else
          {
            openDialog("invalid");
          }
          break;
        case "focusSection":
          let section = message.args[0];
          if (section == "notifications")
          {
            section = "advanced";
            const elem = getPrefElement("notifications_ignoredcategories");
            elem.classList.add("highlight-animate");
            $("button", elem).focus();
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
      onSubscriptionMessage(message.action, ...message.args);
      setupFiltersBox();
      break;
  }
});

api.port.postMessage({
  type: "app.listen",
  filter: ["addSubscription", "focusSection"]
});
api.port.postMessage({
  type: "filters.listen",
  filter: ["added", "changed", "removed"]
});
api.port.postMessage({
  type: "prefs.listen",
  filter: [
    "elemhide_debug",
    "notifications_ignoredcategories",
    "recommend_language_subscriptions",
    "shouldShowBlockElementMenu",
    "show_devtools_panel",
    "show_statsinicon",
    "ui_warn_tracking"
  ]
});
api.port.postMessage({
  type: "subscriptions.listen",
  filter: ["added", "changed", "filtersDisabled", "removed"]
});

onDOMLoaded();

// We must call port.disconnect because of this Microsoft Edge bug:
// https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/19011773/
window.addEventListener("unload", () => api.port.disconnect());
window.addEventListener("hashchange", onHashChange, false);

// Show a generic error message
window.addEventListener(
  "error",
  showNotification.bind(
    null,
    browser.i18n.getMessage("options_generic_error"),
    "error"
  )
);

function dispatchError(error)
{
  if (error)
    window.console.error(error);
  window.dispatchEvent(new CustomEvent("error"));
}
