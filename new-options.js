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

/* globals checkShareResource, getDocLink, i18nFormatDateTime, openSharePopup,
           setLinks, E */

"use strict";

{
  let subscriptionsMap = Object.create(null);
  let filtersMap = Object.create(null);
  let collections = Object.create(null);
  let acceptableAdsUrl = null;
  let acceptableAdsPrivacyUrl = null;
  let isCustomFiltersLoaded = false;
  let {getMessage} = ext.i18n;
  let customFilters = [];
  let filterErrors = new Map([
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

  function Collection(details)
  {
    this.details = details;
    this.items = [];
  }

  Collection.prototype._setEmpty = function(table, texts)
  {
    let placeholders = table.querySelectorAll(".empty-placeholder");

    if (texts && placeholders.length == 0)
    {
      for (let text of texts)
      {
        let placeholder = document.createElement("li");
        placeholder.className = "empty-placeholder";
        placeholder.textContent = getMessage(text);
        table.appendChild(placeholder);
      }
    }
    else if (placeholders.length > 0)
    {
      for (let placeholder of placeholders)
        table.removeChild(placeholder);
    }
  };

  Collection.prototype._createElementQuery = function(item)
  {
    let access = (item.url || item.text).replace(/'/g, "\\'");
    return function(container)
    {
      return container.querySelector("[data-access='" + access + "']");
    };
  };

  Collection.prototype._getItemTitle = function(item, i)
  {
    if (this.details[i].useOriginalTitle && item.originalTitle)
      return item.originalTitle;
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
      if (isAcceptableAds(a.url))
        return 1;
      if (isAcceptableAds(b.url))
        return -1;

      // Make sure that newly added entries always appear on top in descending
      // chronological order
      let aTimestamp = a[timestampUI] || 0;
      let bTimestamp = b[timestampUI] || 0;
      if (aTimestamp || bTimestamp)
        return bTimestamp - aTimestamp;

      let aTitle = this._getItemTitle(a, 0).toLowerCase();
      let bTitle = this._getItemTitle(b, 0).toLowerCase();
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
      let detail = this.details[j];
      let table = E(detail.id);
      let template = table.querySelector("template");
      let listItem = document.createElement("li");
      listItem.appendChild(document.importNode(template.content, true));
      listItem.setAttribute("aria-label", this._getItemTitle(item, j));
      listItem.setAttribute("data-access", item.url || item.text);
      listItem.setAttribute("role", "section");

      let tooltip = listItem.querySelector("[data-tooltip]");
      if (tooltip)
      {
        let tooltipId = tooltip.getAttribute("data-tooltip");
        tooltipId = tooltipId.replace("%value%", item.recommended);
        if (getMessage(tooltipId))
        {
          tooltip.setAttribute("data-tooltip", tooltipId);
        }
      }

      for (let control of listItem.querySelectorAll(".control"))
      {
        if (control.hasAttribute("title"))
        {
          let titleValue = getMessage(control.getAttribute("title"));
          control.setAttribute("title", titleValue);
        }
      }

      this._setEmpty(table, null);
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
    let index = this.items.indexOf(item);
    if (index == -1)
      return;

    this.items.splice(index, 1);
    let getListElement = this._createElementQuery(item);
    for (let detail of this.details)
    {
      let table = E(detail.id);
      let element = getListElement(table);

      // Element gets removed so make sure to handle focus appropriately
      let control = element.querySelector(".control");
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
        this._setEmpty(table, detail.emptyText);
    }
  };

  Collection.prototype.updateItem = function(item)
  {
    let oldIndex = this.items.indexOf(item);
    this._sortItems();
    let access = (item.url || item.text).replace(/'/g, "\\'");
    for (let i = 0; i < this.details.length; i++)
    {
      let table = E(this.details[i].id);
      let element = table.querySelector("[data-access='" + access + "']");
      if (!element)
        continue;

      let title = this._getItemTitle(item, i);
      let displays = element.querySelectorAll(".display");
      for (let j = 0; j < displays.length; j++)
        displays[j].textContent = title;

      element.setAttribute("aria-label", title);
      if (this.details[i].searchable)
        element.setAttribute("data-search", title.toLowerCase());
      let control = element.querySelector(".control[role='checkbox']");
      if (control)
      {
        control.setAttribute("aria-checked", item.disabled == false);
        if (isAcceptableAds(item.url) && this == collections.filterLists)
          control.disabled = true;
      }

      let lastUpdateElement = element.querySelector(".last-update");
      if (lastUpdateElement)
      {
        let message = element.querySelector(".message");
        if (item.isDownloading)
        {
          let text = getMessage("options_filterList_lastDownload_inProgress");
          message.textContent = text;
          element.classList.add("show-message");
        }
        else if (item.downloadStatus != "synchronize_ok")
        {
          let error = filterErrors.get(item.downloadStatus);
          if (error)
            message.textContent = getMessage(error);
          else
            message.textContent = item.downloadStatus;
          element.classList.add("show-message");
        }
        else if (item.lastDownload > 0)
        {
          let lastUpdate = item.lastDownload * 1000;
          let sinceUpdate = Date.now() - lastUpdate;
          if (sinceUpdate > fullDayInMs)
          {
            let lastUpdateDate = new Date(item.lastDownload * 1000);
            let monthName = lastUpdateDate.toLocaleString(undefined,
              {month: "short"});
            let day = lastUpdateDate.getDate();
            day = day < 10 ? "0" + day : day;
            lastUpdateElement.textContent = day + " " + monthName + " " +
              lastUpdateDate.getFullYear();
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

      let websiteElement = element.querySelector(".context-menu .website");
      if (websiteElement)
      {
        if (item.homepage)
          websiteElement.setAttribute("href", item.homepage);
        else
          websiteElement.setAttribute("aria-hidden", true);
      }

      let sourceElement = element.querySelector(".context-menu .source");
      if (sourceElement)
        sourceElement.setAttribute("href", item.url);

      let newIndex = this.items.indexOf(item);
      if (oldIndex != newIndex)
        table.insertBefore(element, table.childNodes[newIndex]);
    }
  };

  Collection.prototype.clearAll = function()
  {
    this.items = [];
    for (let detail of this.details)
    {
      let table = E(detail.id);
      let element = table.firstChild;
      while (element)
      {
        if (element.tagName == "LI" && !element.classList.contains("static"))
          table.removeChild(element);
        element = element.nextElementSibling;
      }

      this._setEmpty(table, detail.emptyText);
    }
  };

  function focusNextElement(container, currentElement)
  {
    let focusables = container.querySelectorAll("a, button, input, .control");
    focusables = Array.prototype.slice.call(focusables);
    let index = focusables.indexOf(currentElement);
    index += (index == focusables.length - 1) ? -1 : 1;

    let nextElement = focusables[index];
    if (!nextElement)
      return false;

    nextElement.focus();
    return true;
  }

  collections.protection = new Collection([
    {
      id: "recommend-protection-list-table"
    }
  ]);
  collections.langs = new Collection([
    {
      id: "blocking-languages-table",
      emptyText: ["options_language_empty"]
    }
  ]);
  collections.allLangs = new Collection([
    {
      id: "all-lang-table-add",
      emptyText: ["options_dialog_language_other_empty"]
    }
  ]);
  collections.custom = new Collection([
    {
      id: "custom-list-table"
    }
  ]);
  collections.whitelist = new Collection([
    {
      id: "whitelisting-table",
      emptyText: ["options_whitelist_empty_1", "options_whitelist_empty_2"]
    }
  ]);
  collections.filterLists = new Collection([
    {
      id: "all-filter-lists-table",
      useOriginalTitle: true
    }
  ]);

  function addSubscription(subscription)
  {
    let collection = null;
    if (subscription.recommended)
    {
      if (subscription.recommended == "ads")
      {
        if (subscription.disabled == false)
          collection = collections.langs;

        collections.allLangs.addItem(subscription);
      }
      else
      {
        collection = collections.protection;
      }
    }
    else if (!isAcceptableAds(subscription.url))
    {
      collection = collections.custom;
    }

    if (collection)
      collection.addItem(subscription);

    subscriptionsMap[subscription.url] = subscription;
    updateTooltips();
  }

  function updateSubscription(subscription)
  {
    for (let name in collections)
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
        collections.custom.addItem(subscription);
        updateTooltips();
      }
      else
      {
        collections.custom.removeItem(subscription);
      }
    }
  }

  function updateFilter(filter)
  {
    let match = filter.text.match(whitelistedDomainRegexp);
    if (match && !filtersMap[filter.text])
    {
      filter.title = match[1];
      collections.whitelist.addItem(filter);
      if (isCustomFiltersLoaded)
      {
        let text = getMessage("options_whitelist_notification", [filter.title]);
        showNotification(text);
      }
    }
    else
    {
      customFilters.push(filter.text);
      if (isCustomFiltersLoaded)
        updateCustomFiltersUi();
    }

    filtersMap[filter.text] = filter;
  }

  function removeCustomFilter(text)
  {
    let index = customFilters.indexOf(text);
    if (index >= 0)
      customFilters.splice(index, 1);

    updateCustomFiltersUi();
  }

  function updateCustomFiltersUi()
  {
    let customFiltersListElement = E("custom-filters-raw");
    customFiltersListElement.value = customFilters.join("\n");
  }

  function loadRecommendations()
  {
    fetch("subscriptions.xml")
      .then((response) =>
      {
        return response.text();
      })
      .then((text) =>
      {
        let doc = new DOMParser().parseFromString(text, "application/xml");
        let elements = doc.documentElement.getElementsByTagName("subscription");
        for (let element of elements)
        {
          let type = element.getAttribute("type");
          let subscription = {
            disabled: true,
            downloadStatus: null,
            homepage: null,
            originalTitle: element.getAttribute("title"),
            recommended: type,
            url: element.getAttribute("url")
          };

          let prefix = element.getAttribute("prefixes");
          if (prefix)
          {
            prefix = prefix.replace(/\W/g, "_");
            subscription.title = getMessage("options_language_" + prefix);
          }
          else
          {
            type = type.replace(/\W/g, "_");
            subscription.title = getMessage("common_feature_" +
                                            type + "_title");
          }

          addSubscription(subscription);
        }
      });
  }

  function findParentData(element, dataName, returnElement)
  {
    while (element)
    {
      if (element.hasAttribute("data-" + dataName))
      {
        if (returnElement)
          return element;
        return element.getAttribute("data-" + dataName);
      }

      element = element.parentElement;
    }
    return null;
  }

  function sendMessageHandleErrors(message, onSuccess)
  {
    ext.backgroundPage.sendMessage(message, (errors) =>
    {
      if (errors.length > 0)
        alert(errors.join("\n"));
      else if (onSuccess)
        onSuccess();
    });
  }

  function openDocLink(id)
  {
    getDocLink(id, (link) =>
    {
      location.href = link;
    });
  }

  function switchTab(id)
  {
    location.hash = id;
  }

  function execAction(action, element)
  {
    switch (action)
    {
      case "add-domain-exception":
        addWhitelistedDomain();
        break;
      case "add-language-subscription":
        addEnableSubscription(findParentData(element, "access", false));
        break;
      case "add-predefined-subscription": {
        let dialog = E("dialog-content-predefined");
        let title = dialog.querySelector("h3").textContent;
        let url = dialog.querySelector(".url").textContent;
        addEnableSubscription(url, title);
        closeDialog();
        break;
      }
      case "cancel-custom-filters":
        setCustomFiltersView("read");
        break;
      case "change-language-subscription":
        for (let key in subscriptionsMap)
        {
          let subscription = subscriptionsMap[key];
          let subscriptionType = subscription.recommended;
          if (subscriptionType == "ads" && subscription.disabled == false)
          {
            ext.backgroundPage.sendMessage({
              type: "subscriptions.remove",
              url: subscription.url
            });
            ext.backgroundPage.sendMessage({
              type: "subscriptions.add",
              url: findParentData(element, "access", false)
            });
            break;
          }
        }
        break;
      case "close-dialog":
        closeDialog();
        break;
      case "edit-custom-filters":
        setCustomFiltersView("write");
        break;
      case "hide-notification":
        hideNotification();
        break;
      case "import-subscription": {
        let url = E("blockingList-textbox").value;
        addEnableSubscription(url);
        closeDialog();
        break;
      }
      case "open-context-menu": {
        let listItem = findParentData(element, "access", true);
        if (listItem && !listItem.classList.contains("show-context-menu"))
          listItem.classList.add("show-context-menu");
        break;
      }
      case "open-dialog": {
        let dialog = findParentData(element, "dialog", false);
        openDialog(dialog);
        break;
      }
      case "open-doclink": {
        let doclink = findParentData(element, "doclink", false);
        openDocLink(doclink);
        break;
      }
      case "remove-filter":
        ext.backgroundPage.sendMessage({
          type: "filters.remove",
          text: findParentData(element, "access", false)
        });
        break;
      case "remove-subscription":
        ext.backgroundPage.sendMessage({
          type: "subscriptions.remove",
          url: findParentData(element, "access", false)
        });
        break;
      case "save-custom-filters":
        sendMessageHandleErrors({
          type: "filters.importRaw",
          text: E("custom-filters-raw").value,
          removeExisting: true
        },
        () =>
        {
          setCustomFiltersView("read");
        });
        break;
      case "switch-acceptable-ads":
        let {value} = element;
        ext.backgroundPage.sendMessage({
          type: value == "privacy" ? "subscriptions.add" :
            "subscriptions.remove",
          url: acceptableAdsPrivacyUrl
        });
        ext.backgroundPage.sendMessage({
          type: value == "ads" ? "subscriptions.add" : "subscriptions.remove",
          url: acceptableAdsUrl
        });
        break;
      case "switch-tab":
        let tabId = findParentData(element, "tab", false);
        switchTab(tabId);
        break;
      case "toggle-disable-subscription":
        ext.backgroundPage.sendMessage({
          type: "subscriptions.toggle",
          keepInstalled: true,
          url: findParentData(element, "access", false)
        });
        break;
      case "toggle-pref":
        ext.backgroundPage.sendMessage({
          type: "prefs.toggle",
          key: findParentData(element, "pref", false)
        });
        break;
      case "toggle-remove-subscription":
        let subscriptionUrl = findParentData(element, "access", false);
        if (element.getAttribute("aria-checked") == "true")
        {
          ext.backgroundPage.sendMessage({
            type: "subscriptions.remove",
            url: subscriptionUrl
          });
        }
        else
          addEnableSubscription(subscriptionUrl);
        break;
      case "update-all-subscriptions":
        ext.backgroundPage.sendMessage({
          type: "subscriptions.update"
        });
        break;
      case "update-subscription":
        ext.backgroundPage.sendMessage({
          type: "subscriptions.update",
          url: findParentData(element, "access", false)
        });
        break;
    }
  }

  function setCustomFiltersView(mode)
  {
    let customFiltersElement = E("custom-filters-raw");
    updateCustomFiltersUi();
    if (mode == "read")
    {
      customFiltersElement.disabled = true;
      if (!customFiltersElement.value)
      {
        setCustomFiltersView("empty");
        return;
      }
    }
    else if (mode == "write")
    {
      customFiltersElement.disabled = false;
    }

    E("custom-filters").dataset.mode = mode;
  }

  function onClick(e)
  {
    let context = document.querySelector(".show-context-menu");
    if (context)
      context.classList.remove("show-context-menu");

    let actions = findParentData(e.target, "action", false);
    if (!actions)
      return;

    actions = actions.split(",");
    for (let action of actions)
    {
      execAction(action, e.target);
    }
  }

  function getKey(e)
  {
    // e.keyCode has been deprecated so we attempt to use e.key
    if ("key" in e)
      return e.key;
    return getKey.keys[e.keyCode];
  }
  getKey.keys = {
    9: "Tab",
    13: "Enter",
    27: "Escape",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown"
  };

  function onKeyUp(e)
  {
    let key = getKey(e);
    let element = document.activeElement;
    if (!key || !element)
      return;

    let container = findParentData(element, "action", true);
    if (!container || !container.hasAttribute("data-keys"))
      return;

    let keys = container.getAttribute("data-keys").split(" ");
    if (keys.indexOf(key) < 0)
      return;

    if (element.getAttribute("role") == "tab")
    {
      if (key == "ArrowLeft" || key == "ArrowUp")
        element = element.previousElementSibling || container.lastElementChild;
      else if (key == "ArrowRight" || key == "ArrowDown")
        element = element.nextElementSibling || container.firstElementChild;
    }

    let actions = container.getAttribute("data-action").split(",");
    for (let action of actions)
    {
      execAction(action, element);
    }
  }

  function selectTabItem(tabId, container, focus)
  {
    // Show tab content
    document.body.setAttribute("data-tab", tabId);

    // Select tab
    let tabList = container.querySelector("[role='tablist']");
    if (!tabList)
      return null;

    let previousTab = tabList.querySelector("[aria-selected]");
    previousTab.removeAttribute("aria-selected");
    previousTab.setAttribute("tabindex", -1);

    let tab = tabList.querySelector("li[data-tab='" + tabId + "']");
    tab.setAttribute("aria-selected", true);
    tab.setAttribute("tabindex", 0);

    let tabContentId = tab.getAttribute("aria-controls");
    let tabContent = document.getElementById(tabContentId);

    if (tab && focus)
      tab.focus();

    return tabContent;
  }

  function onHashChange()
  {
    let hash = location.hash.substr(1);
    if (!hash)
      return;

    // Select tab and parent tabs
    let tabIds = hash.split("-");
    let tabContent = document.body;
    for (let i = 0; i < tabIds.length; i++)
    {
      let tabId = tabIds.slice(0, i + 1).join("-");
      tabContent = selectTabItem(tabId, tabContent, true);
      if (!tabContent)
        break;
    }
  }

  function onDOMLoaded()
  {
    populateLists();

    // Initialize navigation sidebar
    ext.backgroundPage.sendMessage({
      type: "app.get",
      what: "addonVersion"
    },
    (addonVersion) =>
    {
      E("abp-version").textContent = addonVersion;
    });
    getDocLink("releases", (link) =>
    {
      E("link-version").setAttribute("href", link);
    });

    updateShareLink();
    updateTooltips();

    // Initialize interactive UI elements
    document.body.addEventListener("click", onClick, false);
    document.body.addEventListener("keyup", onKeyUp, false);
    let exampleValue = getMessage("options_whitelist_placeholder_example",
      ["www.example.com"]);
    E("whitelisting-textbox").setAttribute("placeholder", exampleValue);
    E("whitelisting-textbox").addEventListener("keyup", (e) =>
    {
      E("whitelisting-add-button").disabled = !e.target.value;
    }, false);

    getDocLink("acceptable_ads_criteria", (link) =>
    {
      setLinks("enable-aa-description", link);
    });

    // Advanced tab
    let customize = document.querySelectorAll("#customize li[data-pref]");
    customize = Array.prototype.map.call(customize, (checkbox) =>
    {
      return checkbox.getAttribute("data-pref");
    });
    for (let key of customize)
    {
      getPref(key, (value) =>
      {
        onPrefMessage(key, value, true);
      });
    }
    ext.backgroundPage.sendMessage({
      type: "app.get",
      what: "features"
    },
    (features) =>
    {
      hidePref("show_devtools_panel", !features.devToolsPanel);
    });

    getDocLink("filterdoc", (link) =>
    {
      E("link-filters").setAttribute("href", link);
    });

    getDocLink("subscriptions", (link) =>
    {
      setLinks("filter-lists-description", link);
    });

    E("custom-filters-raw").setAttribute("placeholder",
      getMessage("options_customFilters_edit_placeholder", ["/ads/track/*"]));

    // Help tab
    getDocLink("adblock_plus_report_issue", (link) =>
    {
      setLinks("report-issue", link);
    });
    getDocLink("adblock_plus_report_ad", (link) =>
    {
      setLinks("report-ad", link);
    });
    getDocLink("adblock_plus_report_bug", (link) =>
    {
      setLinks("report-bug", link);
    });
    getDocLink("reporter_other_link", (link) =>
    {
      setLinks("report-forum", link);
    });
    getDocLink("social_twitter", (link) =>
    {
      E("twitter").setAttribute("href", link);
    });
    getDocLink("social_facebook", (link) =>
    {
      E("facebook").setAttribute("href", link);
    });
    getDocLink("social_gplus", (link) =>
    {
      E("google-plus").setAttribute("href", link);
    });
    getDocLink("social_weibo", (link) =>
    {
      E("weibo").setAttribute("href", link);
    });

    E("dialog").addEventListener("keydown", function(e)
    {
      switch (getKey(e))
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
    let dialog = E("dialog");
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
    let dialog = E("dialog");
    dialog.setAttribute("aria-hidden", true);
    dialog.removeAttribute("aria-labelledby");
    document.body.removeAttribute("data-dialog");
    focusedBeforeDialog.focus();
  }

  function showNotification(text)
  {
    E("notification").setAttribute("aria-hidden", false);
    E("notification-text").textContent = text;
    setTimeout(hideNotification, 3000);
  }

  function hideNotification()
  {
    E("notification").setAttribute("aria-hidden", true);
    E("notification-text").textContent = "";
  }

  function setAcceptableAds()
  {
    let option = "none";
    document.forms["acceptable-ads"].classList.remove("show-dnt-notification");
    if (acceptableAdsUrl in subscriptionsMap)
    {
      option = "ads";
    }
    else if (acceptableAdsPrivacyUrl in subscriptionsMap)
    {
      option = "privacy";

      if (!navigator.doNotTrack)
        document.forms["acceptable-ads"].classList.add("show-dnt-notification");
    }
    document.forms["acceptable-ads"]["acceptable-ads"].value = option;
  }

  function isAcceptableAds(url)
  {
    return url == acceptableAdsUrl || url == acceptableAdsPrivacyUrl;
  }

  function populateLists()
  {
    subscriptionsMap = Object.create(null);
    filtersMap = Object.create(null);

    // Empty collections and lists
    for (let property in collections)
      collections[property].clearAll();

    ext.backgroundPage.sendMessage({
      type: "subscriptions.get",
      special: true
    },
    (subscriptions) =>
    {
      // Load filters
      for (let subscription of subscriptions)
      {
        ext.backgroundPage.sendMessage({
          type: "filters.get",
          subscriptionUrl: subscription.url
        },
        (filters) =>
        {
          for (let filter of filters)
            updateFilter(filter);

          isCustomFiltersLoaded = true;
          setCustomFiltersView("read");
        });
      }
    });
    loadRecommendations();
    ext.backgroundPage.sendMessage({
      type: "prefs.get",
      key: "subscriptions_exceptionsurl"
    },
    (url) =>
    {
      acceptableAdsUrl = url;
      addSubscription({
        url: acceptableAdsUrl,
        disabled: true
      });

      ext.backgroundPage.sendMessage({
        type: "prefs.get",
        key: "subscriptions_exceptionsurl_privacy"
      },
      (urlPrivacy) =>
      {
        acceptableAdsPrivacyUrl = urlPrivacy;

        // Load user subscriptions
        ext.backgroundPage.sendMessage({
          type: "subscriptions.get",
          downloadable: true
        },
        (subscriptions) =>
        {
          for (let subscription of subscriptions)
            onSubscriptionMessage("added", subscription);
        });
      });
    });
  }

  function addWhitelistedDomain()
  {
    let domain = E("whitelisting-textbox");
    for (let whitelistItem of collections.whitelist.items)
    {
      if (whitelistItem.title == domain.value)
      {
        whitelistItem[timestampUI] = Date.now();
        collections.whitelist.updateItem(whitelistItem);
        domain.value = "";
        break;
      }
    }
    if (domain.value)
    {
      sendMessageHandleErrors({
        type: "filters.add",
        text: "@@||" + domain.value.toLowerCase() + "^$document"
      });
    }

    domain.value = "";
    E("whitelisting-add-button").disabled = true;
  }

  function addEnableSubscription(url, title, homepage)
  {
    let messageType = null;
    let knownSubscription = subscriptionsMap[url];
    if (knownSubscription && knownSubscription.disabled == true)
      messageType = "subscriptions.toggle";
    else
      messageType = "subscriptions.add";

    let message = {
      type: messageType,
      url
    };
    if (title)
      message.title = title;
    if (homepage)
      message.homepage = homepage;

    ext.backgroundPage.sendMessage(message);
  }

  function onFilterMessage(action, filter)
  {
    switch (action)
    {
      case "added":
        filter[timestampUI] = Date.now();
        updateFilter(filter);
        updateShareLink();
        break;
      case "loaded":
        populateLists();
        break;
      case "removed":
        let knownFilter = filtersMap[filter.text];
        if (whitelistedDomainRegexp.test(knownFilter.text))
          collections.whitelist.removeItem(knownFilter);
        else
          removeCustomFilter(filter.text);

        delete filtersMap[filter.text];
        updateShareLink();
        break;
    }
  }

  function onSubscriptionMessage(action, subscription)
  {
    if (subscription.url in subscriptionsMap)
    {
      let knownSubscription = subscriptionsMap[subscription.url];
      for (let property in subscription)
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
        break;
      case "downloading":
      case "downloadStatus":
      case "homepage":
      case "lastDownload":
      case "title":
        updateSubscription(subscription);
        break;
      case "added":
        if (subscription.url in subscriptionsMap)
          updateSubscription(subscription);
        else
          addSubscription(subscription);

        if (isAcceptableAds(subscription.url))
          setAcceptableAds();

        collections.filterLists.addItem(subscription);
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
            collections.custom.removeItem(subscription);
          }
        }
        collections.filterLists.removeItem(subscription);
        break;
    }

    updateShareLink();
  }

  function hidePref(key, value)
  {
    let element = document.querySelector("[data-pref='" + key + "']");
    if (element)
      element.setAttribute("aria-hidden", value);
  }

  function getPref(key, callback)
  {
    let checkPref = getPref.checks[key] || getPref.checkNone;
    checkPref((isActive) =>
    {
      if (!isActive)
      {
        hidePref(key, !isActive);
        return;
      }

      ext.backgroundPage.sendMessage({
        type: "prefs.get",
        key
      }, callback);
    });
  }

  getPref.checkNone = function(callback)
  {
    callback(true);
  };

  getPref.checks =
  {
    notifications_ignoredcategories(callback)
    {
      getPref("notifications_showui", callback);
    }
  };

  function onPrefMessage(key, value, initial)
  {
    switch (key)
    {
      case "notifications_ignoredcategories":
        value = value.indexOf("*") == -1;
        break;

      case "notifications_showui":
        hidePref("notifications_ignoredcategories", !value);
        break;
    }

    let checkbox = document.querySelector(
      "[data-pref='" + key + "'] button[role='checkbox']"
    );
    if (checkbox)
      checkbox.setAttribute("aria-checked", value);
  }

  function updateShareLink()
  {
    let shareResources = [
      "https://facebook.com/plugins/like.php?",
      "https://platform.twitter.com/widgets/",
      "https://apis.google.com/se/0/_/+1/fastbutton?"
    ];
    let isAnyBlocked = false;
    let checksRemaining = shareResources.length;

    function onResult(isBlocked)
    {
      isAnyBlocked |= isBlocked;
      if (!--checksRemaining)
      {
        // Hide the share tab if a script on the share page would be blocked
        E("tab-share").hidden = isAnyBlocked;
      }
    }

    for (let sharedResource of shareResources)
      checkShareResource(sharedResource, onResult);
  }

  function updateTooltips()
  {
    let anchors = document.querySelectorAll(":not(.tooltip) > [data-tooltip]");
    for (let anchor of anchors)
    {
      let id = anchor.getAttribute("data-tooltip");

      let wrapper = document.createElement("div");
      wrapper.className = "tooltip";
      anchor.parentNode.replaceChild(wrapper, anchor);
      wrapper.appendChild(anchor);

      let tooltip = document.createElement("div");
      tooltip.setAttribute("role", "tooltip");

      let paragraph = document.createElement("p");
      paragraph.textContent = getMessage(id);
      tooltip.appendChild(paragraph);

      wrapper.appendChild(tooltip);
    }
  }

  ext.onMessage.addListener((message) =>
  {
    switch (message.type)
    {
      case "app.respond":
        switch (message.action)
        {
          case "addSubscription":
            let subscription = message.args[0];
            let dialog = E("dialog-content-predefined");
            dialog.querySelector("h3").textContent = subscription.title || "";
            dialog.querySelector(".url").textContent = subscription.url;
            openDialog("predefined");
            break;
          case "focusSection":
            document.body.setAttribute("data-tab", message.args[0]);
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

  ext.backgroundPage.sendMessage({
    type: "app.listen",
    filter: ["addSubscription", "focusSection"]
  });
  ext.backgroundPage.sendMessage({
    type: "filters.listen",
    filter: ["added", "loaded", "removed"]
  });
  ext.backgroundPage.sendMessage({
    type: "prefs.listen",
    filter: ["notifications_ignoredcategories", "notifications_showui",
             "show_devtools_panel", "shouldShowBlockElementMenu"]
  });
  ext.backgroundPage.sendMessage({
    type: "subscriptions.listen",
    filter: ["added", "disabled", "homepage", "lastDownload", "removed",
             "title", "downloadStatus", "downloading"]
  });

  window.addEventListener("DOMContentLoaded", onDOMLoaded, false);
  window.addEventListener("hashchange", onHashChange, false);
}
