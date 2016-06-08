/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-2016 Eyeo GmbH
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

(function()
{
  var subscriptionsMap = Object.create(null);
  var filtersMap = Object.create(null);
  var collections = Object.create(null);
  var acceptableAdsUrl = null;
  var maxLabelId = 0;
  var getMessage = ext.i18n.getMessage;
  var filterErrors =
  {
    "synchronize_invalid_url": "options_filterList_lastDownload_invalidURL",
    "synchronize_connection_error": "options_filterList_lastDownload_connectionError",
    "synchronize_invalid_data": "options_filterList_lastDownload_invalidData",
    "synchronize_checksum_mismatch": "options_filterList_lastDownload_checksumMismatch"
  };

  function Collection(details)
  {
    this.details = details;
    this.items = [];
  }

  Collection.prototype._setEmpty = function(table, text)
  {
    var placeholder = table.querySelector(".empty-placeholder");
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
    var access = (item.url || item.text).replace(/'/g, "\\'");
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

  Collection.prototype.addItems = function()
  {
    var length = Array.prototype.push.apply(this.items, arguments);
    if (length == 0)
      return;

    this.items.sort(function(a, b)
    {
      // Make sure that Acceptable Ads is always last, since it cannot be
      // disabled, but only be removed. That way it's grouped together with
      // the "Own filter list" which cannot be disabled either at the bottom
      // of the filter lists in the Advanced tab.
      if (a.url == acceptableAdsUrl)
        return 1;
      if (b.url == acceptableAdsUrl)
        return -1;

      var aTitle = this._getItemTitle(a, 0).toLowerCase();
      var bTitle = this._getItemTitle(b, 0).toLowerCase();
      return aTitle.localeCompare(bTitle);
    }.bind(this));

    for (var j = 0; j < this.details.length; j++)
    {
      var table = E(this.details[j].id);
      var template = table.querySelector("template");
      for (var i = 0; i < arguments.length; i++)
      {
        var item = arguments[i];
        var listItem = document.createElement("li");
        listItem.appendChild(document.importNode(template.content, true));
        listItem.setAttribute("data-access", item.url || item.text);

        var labelId = "label-" + (++maxLabelId);
        var label = listItem.querySelector(".display");
        label.setAttribute("id", labelId);
        if (item.recommended && label.hasAttribute("data-tooltip"))
        {
          var tooltipId = label.getAttribute("data-tooltip");
          tooltipId = tooltipId.replace("%value%", item.recommended);
          label.setAttribute("data-tooltip", tooltipId);
        }

        var control = listItem.querySelector(".control");
        if (control)
        {
          control.setAttribute("aria-labelledby", labelId);
          control.addEventListener("click", this.details[j].onClick, false);

          var role = control.getAttribute("role");
          if (role == "checkbox" && !label.hasAttribute("data-action"))
          {
            var controlId = "control-" + maxLabelId;
            control.setAttribute("id", controlId);
            label.setAttribute("for", controlId);
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
    }
    return length;
  };

  Collection.prototype.removeItem = function(item)
  {
    var index = this.items.indexOf(item);
    if (index == -1)
      return;

    this.items.splice(index, 1);
    var getListElement = this._createElementQuery(item);
    for (var i = 0; i < this.details.length; i++)
    {
      var table = E(this.details[i].id);
      var element = getListElement(table);

      // Element gets removed so make sure to handle focus appropriately
      var control = element.querySelector(".control");
      if (control && control == document.activeElement)
      {
        if (!focusNextElement(element.parentElement, control))
        {
          // Fall back to next focusable element within same tab or dialog
          var focusableElement = element.parentElement;
          while (focusableElement)
          {
            if (focusableElement.classList.contains("tab-content")
                || focusableElement.classList.contains("dialog-content"))
              break;

            focusableElement = focusableElement.parentElement;
          }
          focusNextElement(focusableElement || document, control);
        }
      }

      element.parentElement.removeChild(element);
      if (this.items.length == 0)
        this._setEmpty(table, this.details[i].emptyText);
    }
  };

  Collection.prototype.updateItem = function(item)
  {
    var access = (item.url || item.text).replace(/'/g, "\\'");
    for (var i = 0; i < this.details.length; i++)
    {
      var table = E(this.details[i].id);
      var element = table.querySelector("[data-access='" + access + "']");
      if (!element)
        continue;

      var title = this._getItemTitle(item, i);
      element.querySelector(".display").textContent = title;
      if (title)
        element.setAttribute("data-search", title.toLowerCase());
      var control = element.querySelector(".control[role='checkbox']");
      if (control)
      {
        control.setAttribute("aria-checked", item.disabled == false);
        if (item.url == acceptableAdsUrl && this.details[i].onClick ==
                                            toggleDisableSubscription)
          control.setAttribute("disabled", true);
      }

      var dateElement = element.querySelector(".date");
      var timeElement = element.querySelector(".time");
      if (dateElement && timeElement)
      {
        var message = element.querySelector(".message");
        if (item.isDownloading)
        {
          var text = getMessage("options_filterList_lastDownload_inProgress");
          message.textContent = text;
          element.classList.add("show-message");
        }
        else if (item.downloadStatus != "synchronize_ok")
        {
          var error = filterErrors[item.downloadStatus];
          if (error)
            message.textContent = getMessage(error);
          else
            message.textContent = item.downloadStatus;
          element.classList.add("show-message");
        }
        else if (item.lastDownload > 0)
        {
          var dateTime = i18n_formatDateTime(item.lastDownload * 1000);
          dateElement.textContent = dateTime[0];
          timeElement.textContent = dateTime[1];
          element.classList.remove("show-message");
        }
      }

      var websiteElement = element.querySelector(".context-menu .website");
      if (websiteElement)
      {
        if (item.homepage)
          websiteElement.setAttribute("href", item.homepage);
        else
          websiteElement.setAttribute("aria-hidden", true);
      }

      var sourceElement = element.querySelector(".context-menu .source");
      if (sourceElement)
        sourceElement.setAttribute("href", item.url);
    }
  };

  Collection.prototype.clearAll = function()
  {
    this.items = [];
    for (var i = 0; i < this.details.length; i++)
    {
      var table = E(this.details[i].id);
      var element = table.firstChild;
      while (element)
      {
        if (element.tagName == "LI" && !element.classList.contains("static"))
          table.removeChild(element);
        element = element.nextElementSibling;
      }

      this._setEmpty(table, this.details[i].emptyText);
    }
  };

  function focusNextElement(container, currentElement)
  {
    var focusables = container.querySelectorAll("a, button, input, .control");
    focusables = Array.prototype.slice.call(focusables);
    var index = focusables.indexOf(currentElement);
    index += (index == focusables.length - 1) ? -1 : 1;

    var nextElement = focusables[index];
    if (!nextElement)
      return false;

    nextElement.focus();
    return true;
  }

  function toggleRemoveSubscription(e)
  {
    e.preventDefault();
    var subscriptionUrl = findParentData(e.target, "access", false);
    if (e.target.getAttribute("aria-checked") == "true")
    {
      ext.backgroundPage.sendMessage({
        type: "subscriptions.remove",
        url: subscriptionUrl
      });
    }
    else
      addEnableSubscription(subscriptionUrl);
  }

  function toggleDisableSubscription(e)
  {
    e.preventDefault();
    var subscriptionUrl = findParentData(e.target, "access", false);
    ext.backgroundPage.sendMessage(
    {
      type: "subscriptions.toggle",
      keepInstalled: true,
      url: subscriptionUrl
    });
  }

  function onAddLanguageSubscriptionClick(e)
  {
    e.preventDefault();
    var url = findParentData(this, "access", false);
    addEnableSubscription(url);
  }

  function onRemoveFilterClick()
  {
    var filter = findParentData(this, "access", false);
    ext.backgroundPage.sendMessage(
    {
      type: "filters.remove",
      text: filter
    });
  }

  collections.popular = new Collection(
  [
    {
      id: "recommend-list-table",
      onClick: toggleRemoveSubscription
    }
  ]);
  collections.langs = new Collection(
  [
    {
      id: "blocking-languages-table",
      emptyText: "options_dialog_language_added_empty",
      onClick: toggleRemoveSubscription
    },
    {
      id: "blocking-languages-dialog-table",
      emptyText: "options_dialog_language_added_empty"
    }
  ]);
  collections.allLangs = new Collection(
  [
    {
      id: "all-lang-table",
      emptyText: "options_dialog_language_other_empty",
      onClick: onAddLanguageSubscriptionClick
    }
  ]);
  collections.acceptableAds = new Collection(
  [
    {
      id: "acceptableads-table",
      onClick: toggleRemoveSubscription
    }
  ]);
  collections.custom = new Collection(
  [
    {
      id: "custom-list-table",
      onClick: toggleRemoveSubscription
    }
  ]);
  collections.whitelist = new Collection(
  [
    {
      id: "whitelisting-table",
      emptyText: "options_whitelisted_empty",
      onClick: onRemoveFilterClick
    }
  ]);
  collections.customFilters = new Collection(
  [
    {
      id: "custom-filters-table",
      emptyText: "options_customFilters_empty"
    }
  ]);
  collections.filterLists = new Collection(
  [
    {
      id: "all-filter-lists-table",
      onClick: toggleDisableSubscription,
      useOriginalTitle: true
    }
  ]);

  function updateLanguageCollections(subscription)
  {
    if (subscription.recommended == "ads")
    {
      if (subscription.disabled)
      {
        collections.allLangs.addItems(subscription);
        collections.langs.removeItem(subscription);
      }
      else
      {
        collections.allLangs.removeItem(subscription);
        collections.langs.addItems(subscription);
      }
    }
  }

  function addSubscription(subscription)
  {
    var collection;
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

    collection.addItems(subscription);
    subscriptionsMap[subscription.url] = subscription;
    updateTooltips();
  }

  function updateSubscription(subscription)
  {
    var knownSubscription = subscriptionsMap[subscription.url];
    for (var property in subscription)
    {
      if (property == "title" && subscription.recommended)
        knownSubscription.originalTitle = subscription.title;
      else
        knownSubscription[property] = subscription[property];
    }

    for (var name in collections)
      collections[name].updateItem(knownSubscription);

    return knownSubscription;
  }

  function updateFilter(filter)
  {
    var match = filter.text.match(/^@@\|\|([^\/:]+)\^\$document$/);
    if (match && !filtersMap[filter.text])
    {
      filter.title = match[1];
      collections.whitelist.addItems(filter);
    }
    else
      collections.customFilters.addItems(filter);

    filtersMap[filter.text] = filter;
  }

  function loadRecommendations()
  {
    fetch("subscriptions.xml")
      .then(function(response)
      {
        return response.text();
      })
      .then(function(text)
      {
        var list = document.getElementById("subscriptionSelector");
        var doc = new DOMParser().parseFromString(text, "application/xml");
        var elements = doc.documentElement.getElementsByTagName("subscription");
        for (var i = 0; i < elements.length; i++)
        {
          var element = elements[i];
          var type = element.getAttribute("type");
          var subscription = {
            disabled: null,
            downloadStatus: null,
            homepage: null,
            originalTitle: element.getAttribute("title"),
            recommended: type,
            url: element.getAttribute("url")
          };

          var prefix = element.getAttribute("prefixes");
          if (prefix)
          {
            prefix = prefix.replace(/\W/g, "_");
            subscription.title = getMessage("options_language_" + prefix);
          }
          else
          {
            type = type.replace(/\W/g, "_");
            subscription.title = getMessage("common_feature_" + type + "_title");
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
        return returnElement ? element : element.getAttribute("data-" + dataName);

      element = element.parentElement;
    }
    return null;
  }

  function sendMessageHandleErrors(message, onSuccess)
  {
    ext.backgroundPage.sendMessage(message, function(errors)
    {
      if (errors.length > 0)
        alert(errors.join("\n"));
      else if (onSuccess)
        onSuccess();
    });
  }

  function onClick(e)
  {
    var context = document.querySelector(".show-context-menu");
    if (context)
      context.classList.remove("show-context-menu");

    var element = e.target;
    while (true)
    {
      if (!element)
        return;

      if (element.hasAttribute("data-action"))
        break;

      element = element.parentElement;
    }

    var actions = element.getAttribute("data-action").split(",");
    for (var i = 0; i < actions.length; i++)
    {
      switch (actions[i])
      {
        case "add-domain-exception":
          addWhitelistedDomain();
          break;
        case "add-predefined-subscription":
          var dialog = E("dialog-content-predefined");
          var title = dialog.querySelector("h3").textContent;
          var url = dialog.querySelector(".url").textContent;
          addEnableSubscription(url, title);
          closeDialog();
          break;
        case "cancel-custom-filters":
          E("custom-filters").classList.remove("mode-edit");
          break;
        case "cancel-domain-exception":
          E("whitelisting-textbox").value = "";
          document.querySelector("#whitelisting .controls").classList.remove("mode-edit");
          break;
        case "close-dialog":
          closeDialog();
          break;
        case "edit-custom-filters":
          E("custom-filters").classList.add("mode-edit");
          editCustomFilters();
          break;
        case "edit-domain-exception":
          document.querySelector("#whitelisting .controls").classList.add("mode-edit");
          E("whitelisting-textbox").focus();
          break;
        case "import-subscription":
          var url = E("blockingList-textbox").value;
          addEnableSubscription(url);
          closeDialog();
          break;
        case "open-dialog":
          openDialog(element.getAttribute("data-dialog"));
          break;
        case "save-custom-filters":
          sendMessageHandleErrors(
          {
            type: "filters.importRaw",
            text: E("custom-filters-raw").value,
            removeExisting: true
          },
          function()
          {
            E("custom-filters").classList.remove("mode-edit");
          });
          break;
        case "switch-tab":
          document.body.setAttribute("data-tab",
            element.getAttribute("data-tab"));
          break;
        case "toggle-pref":
          ext.backgroundPage.sendMessage(
          {
            type: "prefs.toggle",
            key: findParentData(element, "pref", false)
          });
          break;
        case "update-all-subscriptions":
          ext.backgroundPage.sendMessage(
          {
            type: "subscriptions.update"
          });
          break;
        case "open-context-menu":
          var listItem = findParentData(element, "access", true);
          if (listItem != context)
            listItem.classList.add("show-context-menu");
          break;
        case "update-subscription":
          ext.backgroundPage.sendMessage(
          {
            type: "subscriptions.update",
            url: findParentData(element, "access", false)
          });
          break;
        case "remove-subscription":
          ext.backgroundPage.sendMessage(
          {
            type: "subscriptions.remove",
            url: findParentData(element, "access", false)
          });
          break;
      }
    }
  }

  function onDOMLoaded()
  {
    populateLists();
    function onFindLanguageKeyUp()
    {
      var searchStyle = E("search-style");
      if (!this.value)
        searchStyle.innerHTML = "";
      else
        searchStyle.innerHTML = "#all-lang-table li:not([data-search*=\"" + this.value.toLowerCase() + "\"]) { display: none; }";
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
      27: "Escape"
    };

    // Initialize navigation sidebar
    ext.backgroundPage.sendMessage(
    {
      type: "app.get",
      what: "addonVersion"
    },
    function(addonVersion)
    {
      E("abp-version").textContent = addonVersion;
    });
    getDocLink("releases", function(link)
    {
      E("link-version").setAttribute("href", link);
    });

    getDocLink("contribute", function(link)
    {
      document.querySelector("#tab-contribute a").setAttribute("href", link);
    });

    updateShareLink();
    updateTooltips();

    // Initialize interactive UI elements
    document.body.addEventListener("click", onClick, false);
    var placeholderValue  = getMessage("options_dialog_language_find");
    E("find-language").setAttribute("placeholder", placeholderValue);
    E("find-language").addEventListener("keyup", onFindLanguageKeyUp, false);
    E("whitelisting-textbox").addEventListener("keypress", function(e)
    {
      if (getKey(e) == "Enter")
        addWhitelistedDomain();
    }, false);

    // Advanced tab
    var tweaks = document.querySelectorAll("#tweaks li[data-pref]");
    tweaks = Array.prototype.map.call(tweaks, function(checkbox)
    {
      return checkbox.getAttribute("data-pref");
    });
    tweaks.forEach(function(key)
    {
      getPref(key, function(value)
      {
        onPrefMessage(key, value, true);
      });
    });
    ext.backgroundPage.sendMessage(
    {
      type: "app.get",
      what: "features"
    },
    function(features)
    {
      hidePref("show_devtools_panel", !features.devToolsPanel);

      // Only show option to switch between Safari Content Blockers
      // and event based blocking if both are available.
      hidePref("safari_contentblocker", !(
        features.safariContentBlocker &&
        "canLoad" in safari.self.tab &&
        "onbeforeload" in Element.prototype
      ));
    });

    var filterTextbox = document.querySelector("#custom-filters-add input");
    placeholderValue = getMessage("options_customFilters_textbox_placeholder");
    filterTextbox.setAttribute("placeholder", placeholderValue);
    function addCustomFilters()
    {
      var filterText = filterTextbox.value;
      sendMessageHandleErrors(
      {
        type: "filters.add",
        text: filterText
      },
      function()
      {
        filterTextbox.value = "";
      });
    }
    E("custom-filters-add").addEventListener("submit", function(e)
    {
      e.preventDefault();
      addCustomFilters();
    }, false);
    var customFilterEditButtons = document.querySelectorAll("#custom-filters-edit-wrapper button");

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
  }

  var focusedBeforeDialog = null;
  function openDialog(name)
  {
    var dialog = E("dialog");
    dialog.setAttribute("aria-hidden", false);
    dialog.setAttribute("aria-labelledby", "dialog-title-" + name);
    document.body.setAttribute("data-dialog", name);

    var defaultFocus = document.querySelector("#dialog-content-" + name
      + " .default-focus");
    if (!defaultFocus)
      defaultFocus = dialog.querySelector(".focus-first");
    focusedBeforeDialog = document.activeElement;
    defaultFocus.focus();
  }

  function closeDialog()
  {
    var dialog = E("dialog");
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
    for (var property in collections)
      collections[property].clearAll();

    ext.backgroundPage.sendMessage(
    {
      type: "subscriptions.get",
      special: true
    },
    function(subscriptions)
    {
      // Load filters
      for (var i = 0; i < subscriptions.length; i++)
      {
        ext.backgroundPage.sendMessage(
        {
          type: "filters.get",
          subscriptionUrl: subscriptions[i].url
        },
        function(filters)
        {
          for (var i = 0; i < filters.length; i++)
            updateFilter(filters[i]);
        });
      }
    });
    loadRecommendations();
    ext.backgroundPage.sendMessage(
    {
      type: "prefs.get",
      key: "subscriptions_exceptionsurl"
    },
    function(url)
    {
      acceptableAdsUrl = url;
      addSubscription({
        url: acceptableAdsUrl,
        disabled: true
      });

      // Load user subscriptions
      ext.backgroundPage.sendMessage(
      {
        type: "subscriptions.get",
        downloadable: true
      },
      function(subscriptions)
      {
        for (var i = 0; i < subscriptions.length; i++)
          onSubscriptionMessage("added", subscriptions[i]);
      });
    });
  }

  function addWhitelistedDomain()
  {
    var domain = E("whitelisting-textbox");
    if (domain.value)
    {
      sendMessageHandleErrors(
      {
        type: "filters.add",
        text: "@@||" + domain.value.toLowerCase() + "^$document"
      });
    }

    domain.value = "";
    document.querySelector("#whitelisting .controls").classList.remove("mode-edit");
  }

  function editCustomFilters()
  {
    var customFilterItems = collections.customFilters.items;
    var filterTexts = [];
    for (var i = 0; i < customFilterItems.length; i++)
      filterTexts.push(customFilterItems[i].text);
    E("custom-filters-raw").value = filterTexts.join("\n");
  }

  function addEnableSubscription(url, title, homepage)
  {
    var messageType = null;
    var knownSubscription = subscriptionsMap[url];
    if (knownSubscription && knownSubscription.disabled == true)
      messageType = "subscriptions.toggle";
    else
      messageType = "subscriptions.add";

    var message = {
      type: messageType,
      url: url
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
        var knownFilter = filtersMap[filter.text];
        collections.whitelist.removeItem(knownFilter);
        collections.customFilters.removeItem(knownFilter);
        delete filtersMap[filter.text];
        updateShareLink();
        break;
    }
  }

  function onSubscriptionMessage(action, subscription)
  {
    switch (action)
    {
      case "disabled":
        subscription = updateSubscription(subscription);
        updateLanguageCollections(subscription);
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
          subscription = updateSubscription(subscription);
        else
          addSubscription(subscription);

        collections.filterLists.addItems(subscription);
        updateLanguageCollections(subscription);
        break;
      case "removed":
        var knownSubscription = subscriptionsMap[subscription.url];

        if (subscription.url == acceptableAdsUrl || subscription.recommended)
        {
          subscription.disabled = true;
          onSubscriptionMessage("disabled", subscription);
        }
        else
        {
          collections.custom.removeItem(knownSubscription);
          delete subscriptionsMap[subscription.url];
        }
        collections.filterLists.removeItem(knownSubscription);
        break;
    }

    updateShareLink();
  }

  function hidePref(key, value)
  {
    var element = document.querySelector("[data-pref='" + key + "']");
    if (element)
      element.setAttribute("aria-hidden", value);
  }

  function getPref(key, callback)
  {
    var checkPref = getPref.checks[key] || getPref.checkNone;
    checkPref(function(isActive)
    {
      if (!isActive)
      {
        hidePref(key, !isActive);
        return;
      }

      ext.backgroundPage.sendMessage(
      {
        type: "prefs.get",
        key: key
      }, callback);
    });
  }

  getPref.checkNone = function(callback)
  {
    callback(true);
  };

  getPref.checks =
  {
    notifications_ignoredcategories: function(callback)
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

      case "safari_contentblocker":
        E("restart-safari").setAttribute("aria-hidden", value || initial);
        break;
    }

    var checkbox = document.querySelector("[data-pref='" + key + "'] button[role='checkbox']");
    if (checkbox)
      checkbox.setAttribute("aria-checked", value);
  }

  function onShareLinkClick(e)
  {
    e.preventDefault();

    getDocLink("share-general", openSharePopup);
  }

  function updateShareLink()
  {
    var shareResources = [
      "https://facebook.com/plugins/like.php?",
      "https://platform.twitter.com/widgets/",
      "https://apis.google.com/se/0/_/+1/fastbutton?"
    ];
    var isAnyBlocked = false;
    var checksRemaining = shareResources.length;

    function onResult(isBlocked)
    {
      isAnyBlocked |= isBlocked;
      if (!--checksRemaining)
      {
        // Hide the share tab if a script on the share page would be blocked
        var tab = E("tab-share");
        if (isAnyBlocked)
        {
          tab.hidden = true;
          tab.removeEventListener("click", onShareLinkClick, false);
        }
        else
          tab.addEventListener("click", onShareLinkClick, false);
      }
    }

    for (var i = 0; i < shareResources.length; i++)
      checkShareResource(shareResources[i], onResult);
  }

  function getMessages(id)
  {
    var messages = [];
    for (var i = 1; true; i++)
    {
      var message = ext.i18n.getMessage(id + "_" + i);
      if (!message)
        break;

      messages.push(message);
    }
    return messages;
  }

  function updateTooltips()
  {
    var anchors = document.querySelectorAll(":not(.tooltip) > [data-tooltip]");
    for (var i = 0; i < anchors.length; i++)
    {
      var anchor = anchors[i];
      var id = anchor.getAttribute("data-tooltip");

      var wrapper = document.createElement("div");
      wrapper.className = "tooltip";
      anchor.parentNode.replaceChild(wrapper, anchor);
      wrapper.appendChild(anchor);

      var topTexts = getMessages(id);
      var bottomTexts = getMessages(id + "_notes");

      // We have to use native tooltips to avoid issues when attaching a tooltip
      // to an element in a scrollable list or otherwise it might get cut off
      if (anchor.hasAttribute("data-tooltip-native"))
      {
        var title = topTexts.concat(bottomTexts).join("\n\n");
        anchor.setAttribute("title", title);
        continue;
      }

      var tooltip = document.createElement("div");
      tooltip.setAttribute("role", "tooltip");

      var flip = anchor.getAttribute("data-tooltip-flip");
      if (flip)
        tooltip.className = "flip-" + flip;

      var imageSource = anchor.getAttribute("data-tooltip-image");
      if (imageSource)
      {
        var image = document.createElement("img");
        image.src = imageSource;
        image.alt = "";
        tooltip.appendChild(image);
      }

      for (var j = 0; j < topTexts.length; j++)
      {
        var paragraph = document.createElement("p");
        paragraph.innerHTML = topTexts[j];
        tooltip.appendChild(paragraph);
      }
      if (bottomTexts.length > 0)
      {
        var notes = document.createElement("div");
        notes.className = "notes";
        for (var j = 0; j < bottomTexts.length; j++)
        {
          var paragraph = document.createElement("p");
          paragraph.innerHTML = bottomTexts[j];
          notes.appendChild(paragraph);
        }
        tooltip.appendChild(notes);
      }

      wrapper.appendChild(tooltip);
    }
  }

  ext.onMessage.addListener(function(message)
  {
    switch (message.type)
    {
      case "app.respond":
        switch (message.action)
        {
          case "addSubscription":
            var subscription = message.args[0];
            var dialog = E("dialog-content-predefined");
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

  ext.backgroundPage.sendMessage(
  {
    type: "app.listen",
    filter: ["addSubscription", "focusSection"]
  });
  ext.backgroundPage.sendMessage(
  {
    type: "filters.listen",
    filter: ["added", "loaded", "removed"]
  });
  ext.backgroundPage.sendMessage(
  {
    type: "prefs.listen",
    filter: ["notifications_ignoredcategories", "notifications_showui",
        "safari_contentblocker", "show_devtools_panel",
        "shouldShowBlockElementMenu"]
  });
  ext.backgroundPage.sendMessage(
  {
    type: "subscriptions.listen",
    filter: ["added", "disabled", "homepage", "lastDownload", "removed",
        "title", "downloadStatus", "downloading"]
  });

  window.addEventListener("DOMContentLoaded", onDOMLoaded, false);
})();
