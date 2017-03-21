/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-2017 eyeo GmbH
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
           E */

"use strict";

{
  let subscriptionsMap = Object.create(null);
  let filtersMap = Object.create(null);
  let collections = Object.create(null);
  let acceptableAdsUrl = null;
  let {getMessage} = ext.i18n;
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

  function Collection(details)
  {
    this.details = details;
    this.items = [];
  }

  Collection.prototype._setEmpty = function(table, text)
  {
    let placeholder = table.querySelector(".empty-placeholder");
    if (text && !placeholder)
    {
      placeholder = document.createElement("li");
      placeholder.className = "empty-placeholder";
      placeholder.textContent = getMessage(text);
      table.appendChild(placeholder);
    }
    else if (placeholder)
      table.removeChild(placeholder);
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
    if (item.url == acceptableAdsUrl)
      return getMessage("options_acceptableAds_description");
    if (this.details[i].useOriginalTitle && item.originalTitle)
      return item.originalTitle;
    return item.title || item.url || item.text;
  };

  Collection.prototype.addItem = function(item)
  {
    if (this.items.indexOf(item) >= 0)
      return;

    this.items.push(item);
    this.items.sort((a, b) =>
    {
      // Make sure that Acceptable Ads is always last, since it cannot be
      // disabled, but only be removed. That way it's grouped together with
      // the "Own filter list" which cannot be disabled either at the bottom
      // of the filter lists in the Advanced tab.
      if (a.url == acceptableAdsUrl)
        return 1;
      if (b.url == acceptableAdsUrl)
        return -1;

      let aTitle = this._getItemTitle(a, 0).toLowerCase();
      let bTitle = this._getItemTitle(b, 0).toLowerCase();
      return aTitle.localeCompare(bTitle);
    });

    for (let j = 0; j < this.details.length; j++)
    {
      let table = E(this.details[j].id);
      let template = table.querySelector("template");
      let listItem = document.createElement("li");
      listItem.appendChild(document.importNode(template.content, true));
      listItem.setAttribute("aria-label", this._getItemTitle(item, j));
      listItem.setAttribute("data-access", item.url || item.text);
      listItem.setAttribute("role", "section");

      let label = listItem.querySelector(".display");
      if (item.recommended && label.hasAttribute("data-tooltip"))
      {
        let tooltipId = label.getAttribute("data-tooltip");
        tooltipId = tooltipId.replace("%value%", item.recommended);
        label.setAttribute("data-tooltip", tooltipId);
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
      if (table.hasChildNodes())
      {
        table.insertBefore(listItem,
            table.childNodes[this.items.indexOf(item)]);
      }
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
    let access = (item.url || item.text).replace(/'/g, "\\'");
    for (let i = 0; i < this.details.length; i++)
    {
      let table = E(this.details[i].id);
      let element = table.querySelector("[data-access='" + access + "']");
      if (!element)
        continue;

      let title = this._getItemTitle(item, i);
      element.querySelector(".display").textContent = title;
      element.setAttribute("aria-label", title);
      if (this.details[i].searchable)
        element.setAttribute("data-search", title.toLowerCase());
      let control = element.querySelector(".control[role='checkbox']");
      if (control)
      {
        control.setAttribute("aria-checked", item.disabled == false);
        if (item.url == acceptableAdsUrl && this == collections.filterLists)
          control.setAttribute("disabled", true);
      }

      let dateElement = element.querySelector(".date");
      let timeElement = element.querySelector(".time");
      if (dateElement && timeElement)
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
          let dateTime = i18nFormatDateTime(item.lastDownload * 1000);
          dateElement.textContent = dateTime[0];
          timeElement.textContent = dateTime[1];
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

  collections.popular = new Collection([
    {
      id: "recommend-list-table"
    }
  ]);
  collections.langs = new Collection([
    {
      id: "blocking-languages-table",
      emptyText: "options_dialog_language_added_empty"
    },
    {
      id: "blocking-languages-dialog-table",
      emptyText: "options_dialog_language_added_empty"
    }
  ]);
  collections.allLangs = new Collection([
    {
      id: "all-lang-table",
      emptyText: "options_dialog_language_other_empty",
      searchable: true
    }
  ]);
  collections.acceptableAds = new Collection([
    {
      id: "acceptableads-table"
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
      emptyText: "options_whitelisted_empty"
    }
  ]);
  collections.customFilters = new Collection([
    {
      id: "custom-filters-table",
      emptyText: "options_customFilters_empty"
    }
  ]);
  collections.filterLists = new Collection([
    {
      id: "all-filter-lists-table",
      useOriginalTitle: true
    }
  ]);

  function toggleShowLanguage(subscription)
  {
    if (subscription.recommended == "ads")
    {
      if (subscription.disabled)
      {
        collections.allLangs.addItem(subscription);
        collections.langs.removeItem(subscription);
      }
      else
      {
        collections.allLangs.removeItem(subscription);
        collections.langs.addItem(subscription);
      }
    }
  }

  function addSubscription(subscription)
  {
    let collection;
    if (subscription.recommended)
    {
      if (subscription.recommended != "ads")
        collection = collections.popular;
      else if (subscription.disabled == false)
        collection = collections.langs;
      else
        collection = collections.allLangs;
    }
    else if (subscription.url == acceptableAdsUrl)
      collection = collections.acceptableAds;
    else
      collection = collections.custom;

    collection.addItem(subscription);
    subscriptionsMap[subscription.url] = subscription;
    toggleShowLanguage(subscription);
    updateTooltips();
  }

  function updateSubscription(subscription)
  {
    for (let name in collections)
      collections[name].updateItem(subscription);

    toggleShowLanguage(subscription);
  }

  function updateFilter(filter)
  {
    let match = filter.text.match(/^@@\|\|([^/:]+)\^\$document$/);
    if (match && !filtersMap[filter.text])
    {
      filter.title = match[1];
      collections.whitelist.addItem(filter);
    }
    else
      collections.customFilters.addItem(filter);

    filtersMap[filter.text] = filter;
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
      if (id == "share-general")
        openSharePopup(link);
      else
        location.href = link;
    });
  }

  function switchTab(id)
  {
    location.hash = id;
  }

  function onClick(e)
  {
    let context = document.querySelector(".show-context-menu");
    if (context)
      context.classList.remove("show-context-menu");

    let element = findParentData(e.target, "action", true);
    if (!element)
      return;

    let actions = element.getAttribute("data-action").split(",");
    for (let action of actions)
    {
      switch (action)
      {
        case "add-domain-exception":
          addWhitelistedDomain();
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
          E("custom-filters").classList.remove("mode-edit");
          break;
        case "cancel-domain-exception":
          E("whitelisting-textbox").value = "";
          document.querySelector("#whitelisting .controls").classList
            .remove("mode-edit");
          break;
        case "close-dialog":
          closeDialog();
          break;
        case "edit-custom-filters":
          E("custom-filters").classList.add("mode-edit");
          editCustomFilters();
          break;
        case "edit-domain-exception":
          document.querySelector("#whitelisting .controls").classList
            .add("mode-edit");
          E("whitelisting-textbox").focus();
          break;
        case "import-subscription": {
          let url = E("blockingList-textbox").value;
          addEnableSubscription(url);
          closeDialog();
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
        case "save-custom-filters":
          sendMessageHandleErrors({
            type: "filters.importRaw",
            text: E("custom-filters-raw").value,
            removeExisting: true
          },
          () =>
          {
            E("custom-filters").classList.remove("mode-edit");
          });
          break;
        case "switch-tab": {
          let tabId = findParentData(e.target, "tab", false);
          switchTab(tabId);
          break;
        }
        case "toggle-pref":
          ext.backgroundPage.sendMessage({
            type: "prefs.toggle",
            key: findParentData(element, "pref", false)
          });
          break;
        case "update-all-subscriptions":
          ext.backgroundPage.sendMessage({
            type: "subscriptions.update"
          });
          break;
        case "open-context-menu": {
          let listItem = findParentData(element, "access", true);
          if (listItem != context)
            listItem.classList.add("show-context-menu");
          break;
        }
        case "update-subscription":
          ext.backgroundPage.sendMessage({
            type: "subscriptions.update",
            url: findParentData(element, "access", false)
          });
          break;
        case "remove-subscription":
          ext.backgroundPage.sendMessage({
            type: "subscriptions.remove",
            url: findParentData(element, "access", false)
          });
          break;
        case "toggle-remove-subscription": {
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
        }
        case "toggle-disable-subscription":
          ext.backgroundPage.sendMessage({
            type: "subscriptions.toggle",
            keepInstalled: true,
            url: findParentData(element, "access", false)
          });
          break;
        case "add-language-subscription":
          addEnableSubscription(findParentData(element, "access", false));
          break;
        case "remove-filter":
          ext.backgroundPage.sendMessage({
            type: "filters.remove",
            text: findParentData(element, "access", false)
          });
          break;
      }
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

    switch (container.getAttribute("data-action"))
    {
      case "add-domain-exception":
        addWhitelistedDomain();
        break;
      case "open-doclink":
        let doclink = findParentData(element, "doclink", false);
        openDocLink(doclink);
        break;
      case "switch-tab":
        if (key == "Enter")
        {
          let tabId = findParentData(element, "tab", false);
          switchTab(tabId);
        }
        else if (element.hasAttribute("aria-selected"))
        {
          if (key == "ArrowLeft" || key == "ArrowUp")
          {
            element = element.previousElementSibling ||
                container.lastElementChild;
          }
          else if (key == "ArrowRight" || key == "ArrowDown")
          {
            element = element.nextElementSibling ||
                container.firstElementChild;
          }

          let tabId = findParentData(element, "tab", false);
          switchTab(tabId);
        }
        break;
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

    // Select sub tabs
    if (tab.hasAttribute("data-subtab"))
      selectTabItem(tab.getAttribute("data-subtab"), tabContent, false);

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
    function onFindLanguageKeyUp()
    {
      let searchStyle = E("search-style");
      if (!this.value)
        searchStyle.innerHTML = "";
      else
      {
        searchStyle.innerHTML = "#all-lang-table li:not([data-search*=\"" +
          this.value.toLowerCase() + "\"]) { display: none; }";
      }
    }

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
    let placeholderValue = getMessage("options_dialog_language_find");
    E("find-language").setAttribute("placeholder", placeholderValue);
    E("find-language").addEventListener("keyup", onFindLanguageKeyUp, false);
    E("whitelisting-textbox").addEventListener("keypress", (e) =>
    {
      if (getKey(e) == "Enter")
        addWhitelistedDomain();
    }, false);

    // Advanced tab
    let tweaks = document.querySelectorAll("#tweaks li[data-pref]");
    tweaks = Array.prototype.map.call(tweaks, (checkbox) =>
    {
      return checkbox.getAttribute("data-pref");
    });
    for (let key of tweaks)
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

    let filterTextbox = document.querySelector("#custom-filters-add input");
    placeholderValue = getMessage("options_customFilters_textbox_placeholder");
    filterTextbox.setAttribute("placeholder", placeholderValue);
    function addCustomFilters()
    {
      let filterText = filterTextbox.value;
      sendMessageHandleErrors({
        type: "filters.add",
        text: filterText
      },
      () =>
      {
        filterTextbox.value = "";
      });
    }
    E("custom-filters-add").addEventListener("submit", (e) =>
    {
      e.preventDefault();
      addCustomFilters();
    }, false);

    // Help tab
    getDocLink("faq", (link) =>
    {
      E("link-faq").setAttribute("href", link);
    });
    getDocLink("social_twitter", (link) =>
    {
      E("link-twitter").setAttribute("href", link);
    });
    getDocLink("social_facebook", (link) =>
    {
      E("link-facebook").setAttribute("href", link);
    });
    getDocLink("social_gplus", (link) =>
    {
      E("link-gplus").setAttribute("href", link);
    });
    getDocLink("social_renren", (link) =>
    {
      E("link-renren").setAttribute("href", link);
    });
    getDocLink("social_weibo", (link) =>
    {
      E("link-weibo").setAttribute("href", link);
    });

    // Set forum link
    ext.backgroundPage.sendMessage({
      type: "app.get",
      what: "platform"
    },
    (platform) =>
    {
      ext.backgroundPage.sendMessage({
        type: "app.get",
        what: "application"
      },
      (application) =>
      {
        if (platform == "chromium" && application != "opera")
          application = "chrome";

        getDocLink(application + "_support", (link) =>
        {
          E("link-forum").setAttribute("href", link);
        });
      });
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
  }

  function addWhitelistedDomain()
  {
    let domain = E("whitelisting-textbox");
    if (domain.value)
    {
      sendMessageHandleErrors({
        type: "filters.add",
        text: "@@||" + domain.value.toLowerCase() + "^$document"
      });
    }

    domain.value = "";
    document.querySelector("#whitelisting .controls")
      .classList.remove("mode-edit");
  }

  function editCustomFilters()
  {
    let filterTexts = [];
    for (let customFilterItem of collections.customFilters.items)
      filterTexts.push(customFilterItem.text);
    E("custom-filters-raw").value = filterTexts.join("\n");
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
        updateFilter(filter);
        updateShareLink();
        break;
      case "loaded":
        populateLists();
        break;
      case "removed":
        let knownFilter = filtersMap[filter.text];
        collections.whitelist.removeItem(knownFilter);
        collections.customFilters.removeItem(knownFilter);
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

        collections.filterLists.addItem(subscription);
        break;
      case "removed":
        if (subscription.url == acceptableAdsUrl || subscription.recommended)
        {
          subscription.disabled = true;
          onSubscriptionMessage("disabled", subscription);
        }
        else
        {
          collections.custom.removeItem(subscription);
          delete subscriptionsMap[subscription.url];
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

  function getMessages(id)
  {
    let messages = [];
    for (let i = 1; true; i++)
    {
      let message = ext.i18n.getMessage(id + "_" + i);
      if (!message)
        break;

      messages.push(message);
    }
    return messages;
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

      let topTexts = getMessages(id);
      let bottomTexts = getMessages(id + "_notes");

      // We have to use native tooltips to avoid issues when attaching a tooltip
      // to an element in a scrollable list or otherwise it might get cut off
      if (anchor.hasAttribute("data-tooltip-native"))
      {
        let title = topTexts.concat(bottomTexts).join("\n\n");
        anchor.setAttribute("title", title);
        continue;
      }

      let tooltip = document.createElement("div");
      tooltip.setAttribute("role", "tooltip");

      let flip = anchor.getAttribute("data-tooltip-flip");
      if (flip)
        tooltip.className = "flip-" + flip;

      let imageSource = anchor.getAttribute("data-tooltip-image");
      if (imageSource)
      {
        let image = document.createElement("img");
        image.src = imageSource;
        image.alt = "";
        tooltip.appendChild(image);
      }

      for (let topText of topTexts)
      {
        let paragraph = document.createElement("p");
        paragraph.innerHTML = topText;
        tooltip.appendChild(paragraph);
      }
      if (bottomTexts.length > 0)
      {
        let notes = document.createElement("div");
        notes.className = "notes";
        for (let bottomText of bottomTexts)
        {
          let paragraph = document.createElement("p");
          paragraph.innerHTML = bottomText;
          notes.appendChild(paragraph);
        }
        tooltip.appendChild(notes);
      }

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
