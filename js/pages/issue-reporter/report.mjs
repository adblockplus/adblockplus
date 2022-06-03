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

import api from "../../api";
import {$, $$} from "../../dom";

const reportData = new DOMParser().parseFromString(
  "<report></report>",
  "text/xml"
);
let dataGatheringTabId = null;
let isMinimumTimeMet = false;

function getOriginalTabId()
{
  const tabId = parseInt(location.search.replace(/^\?/, ""), 10);
  if (!tabId && tabId !== 0)
  {
    console.warn("Missing tab id. Try appending '?1' to the end of the url.");
    throw new Error("invalid tab id");
  }

  return tabId;
}

api.port.onMessage.addListener((message) =>
{
  switch (message.type)
  {
    case "requests.respond":
      switch (message.action)
      {
        case "hits":
          const [request, filter, subscriptions] = message.args;
          const requestsContainerElem = $("requests", reportData);
          const filtersElem = $("filters", reportData);
          // ELEMHIDE hitLog request doesn't contain url
          if (request.url)
          {
            let requestElem = $(`[location="${request.url}"]`, reportData);
            if (!requestElem)
            {
              requestElem = reportData.createElement("request");
              requestElem.setAttribute("location", censorURL(request.url));
              requestElem.setAttribute("type", request.type);
              requestElem.setAttribute("docDomain", request.docDomain);
              requestElem.setAttribute("thirdParty", request.thirdParty);
              requestElem.setAttribute("count", 0);
              requestsContainerElem.appendChild(requestElem);
            }

            const countNum = parseInt(requestElem.getAttribute("count"), 10);
            requestElem.setAttribute("count", countNum + 1);

            if (filter)
              requestElem.setAttribute("filter", filter.text);
          }
          if (filter)
          {
            const escapedText = CSS.escape(filter.text);
            const existingFilter = $(`[text="${escapedText}"]`, reportData);
            if (existingFilter)
            {
              const countNum = parseInt(
                existingFilter.getAttribute("hitCount"),
                10
              );
              existingFilter.setAttribute("hitCount", countNum + 1);
            }
            else
            {
              const filterElem = reportData.createElement("filter");
              filterElem.setAttribute("text", filter.text);
              filterElem.setAttribute("subscriptions", subscriptions.join(" "));
              filterElem.setAttribute("hitCount", 1);
              filtersElem.appendChild(filterElem);
            }
          }
          break;
      }
      break;
  }
});

function collectRequests(tabId)
{
  reportData.documentElement.appendChild(reportData.createElement("requests"));
  reportData.documentElement.appendChild(reportData.createElement("filters"));
  return browser.tabs.get(tabId).then(tab =>
  {
    return browser.tabs.create({active: false, url: tab.url});
  }).then((tab) =>
  {
    dataGatheringTabId = tab.id;
    api.port.postMessage({
      type: "requests.listen",
      filter: ["hits"],
      tabId: dataGatheringTabId
    });

    function minimumTimeMet()
    {
      if (isMinimumTimeMet)
        return;

      isMinimumTimeMet = true;
      document.getElementById("showData").disabled = false;
      $("io-steps").dispatchEvent(new CustomEvent("requestcollected"));
      validateCommentsPage();
    }
    browser.tabs.onUpdated.addListener((updatedTabId, changeInfo) =>
    {
      if (updatedTabId == dataGatheringTabId && changeInfo.status == "complete")
        minimumTimeMet();
    });
    window.setTimeout(minimumTimeMet, 5000);
    window.addEventListener("beforeunload", (event) =>
    {
      closeRequestsCollectingTab();
    });
  });
}

let closedRequestsCollectingTab;
export function closeRequestsCollectingTab()
{
  if (!closedRequestsCollectingTab)
    closedRequestsCollectingTab = browser.tabs.remove(dataGatheringTabId);

  return closedRequestsCollectingTab;
}

function retrieveAddonInfo()
{
  const element = reportData.createElement("adblock-plus");
  return browser.runtime.sendMessage({
    type: "app.get",
    what: "addonVersion"
  }).then(addonVersion =>
  {
    element.setAttribute("version", addonVersion);
    return browser.runtime.sendMessage({
      type: "app.get",
      what: "localeInfo"
    });
  }).then(({locale}) =>
  {
    element.setAttribute("locale", locale);
    reportData.documentElement.appendChild(element);
  });
}

function retrieveApplicationInfo()
{
  const element = reportData.createElement("application");
  return browser.runtime.sendMessage({
    type: "app.get",
    what: "application"
  }).then(application =>
  {
    element.setAttribute("name", capitalize(application));
    return browser.runtime.sendMessage({
      type: "app.get",
      what: "applicationVersion"
    });
  }).then(applicationVersion =>
  {
    element.setAttribute("version", applicationVersion);
    element.setAttribute("vendor", navigator.vendor);
    element.setAttribute("userAgent", navigator.userAgent);
    reportData.documentElement.appendChild(element);
  });
}

function retrievePlatformInfo()
{
  const element = reportData.createElement("platform");
  const {getBrowserInfo, sendMessage} = browser.runtime;
  return Promise.all([
    // Only Firefox supports browser.runtime.getBrowserInfo()
    (getBrowserInfo) ? getBrowserInfo() : null,
    sendMessage({
      type: "app.get",
      what: "platform"
    }),
    sendMessage({
      type: "app.get",
      what: "platformVersion"
    })
  ])
  .then(([browserInfo, platform, platformVersion]) =>
  {
    if (browserInfo)
    {
      element.setAttribute("build", browserInfo.buildID);
    }
    element.setAttribute("name", capitalize(platform));
    element.setAttribute("version", platformVersion);
    reportData.documentElement.appendChild(element);
  });
}

async function retrieveWindowInfo(tabId)
{
  const tab = await browser.tabs.get(tabId);
  let openerUrl = null;
  let referrerUrl = null;

  if (tab.openerTabId)
  {
    const openerTab = await browser.tabs.get(tab.openerTabId);
    openerUrl = openerTab.url;
  }

  // We need to use both browser.tabs.executeScript and
  // browser.scripting.executeScript because they're exclusive to
  // Manifest v2 and v3 respectively
  if ("scripting" in browser)
  {
    const [frameResult] = await browser.scripting.executeScript({
      target: {tabId},
      // Despite being an arrow function, its content is evaluated
      // in the context of the target page
      func: () => document.referrer
    });
    referrerUrl = frameResult.result;
  }
  else
  {
    [referrerUrl] = await browser.tabs.executeScript(tabId, {
      code: "document.referrer"
    });
  }

  const element = reportData.createElement("window");
  if (openerUrl)
  {
    element.setAttribute("opener", censorURL(openerUrl));
  }
  if (referrerUrl)
  {
    element.setAttribute("referrer", censorURL(referrerUrl));
  }
  element.setAttribute("url", censorURL(tab.url));
  reportData.documentElement.appendChild(element);
}

function retrieveSubscriptions()
{
  return browser.runtime.sendMessage({
    type: "subscriptions.get",
    ignoreDisabled: true,
    disabledFilters: true
  }).then(subscriptions =>
  {
    const element = reportData.createElement("subscriptions");
    for (const subscription of subscriptions)
    {
      if (!/^(http|https|ftp):/.test(subscription.url))
        continue;

      const now = Math.round(Date.now() / 1000);
      const subscriptionElement = reportData.createElement("subscription");
      subscriptionElement.setAttribute("id", subscription.url);
      if (subscription.version)
        subscriptionElement.setAttribute("version", subscription.version);
      if (subscription.lastDownload)
      {
        subscriptionElement.setAttribute("lastDownloadAttempt",
                                         subscription.lastDownload - now);
      }
      if (subscription.lastSuccess)
      {
        subscriptionElement.setAttribute("lastDownloadSuccess",
                                         subscription.lastSuccess - now);
      }
      if (subscription.softExpiration)
      {
        subscriptionElement.setAttribute("softExpiration",
                                         subscription.softExpiration - now);
      }
      if (subscription.expires)
      {
        subscriptionElement.setAttribute("hardExpiration",
                                         subscription.expires - now);
      }
      subscriptionElement.setAttribute("downloadStatus",
                                       subscription.downloadStatus);
      subscriptionElement.setAttribute("disabledFilters",
                                       subscription.disabledFilters.length);
      element.appendChild(subscriptionElement);
    }
    reportData.documentElement.appendChild(element);
  });
}

function setConfigurationInfo(configInfo)
{
  let extensionsContainer = $("extensions", reportData);
  let optionsContainer = $("options", reportData);

  if (!configInfo)
  {
    if (extensionsContainer)
    {
      extensionsContainer.parentNode.removeChild(extensionsContainer);
    }
    if (optionsContainer)
    {
      optionsContainer.parentNode.removeChild(optionsContainer);
    }
    return;
  }

  if (!extensionsContainer)
  {
    extensionsContainer = reportData.createElement("extensions");
    reportData.documentElement.appendChild(extensionsContainer);
  }
  if (!optionsContainer)
  {
    optionsContainer = reportData.createElement("options");
    reportData.documentElement.appendChild(optionsContainer);
  }

  extensionsContainer.innerHTML = "";
  optionsContainer.innerHTML = "";

  const {extensions, options} = configInfo;

  for (const id in options)
  {
    const element = reportData.createElement("option");
    element.setAttribute("id", id);
    element.textContent = options[id];
    optionsContainer.appendChild(element);
  }

  for (const extension of extensions)
  {
    const element = reportData.createElement("extension");
    element.setAttribute("id", extension.id);
    element.setAttribute("name", extension.name);
    element.setAttribute("type", extension.type);
    if (extension.version)
    {
      element.setAttribute("version", extension.version);
    }
    extensionsContainer.appendChild(element);
  }
}

// Chrome doesn't update the JavaScript context to reflect changes in the
// extension's permissions so we need to proxy our calls through a frame that
// loads after we request the necessary permissions
// https://bugs.chromium.org/p/chromium/issues/detail?id=594703
function proxyApiCall(apiId, ...args)
{
  return new Promise((resolve) =>
  {
    const iframe = document.createElement("iframe");
    iframe.hidden = true;
    iframe.src = browser.runtime.getURL("proxy.html");
    iframe.onload = () =>
    {
      function callback(...results)
      {
        document.body.removeChild(iframe);
        resolve(results[0]);
      }

      // The following APIs are injected at runtime so we can't rely on our
      // promise polyfill. Therefore we simplify things by proxying calls even
      // if the API has been made available to us in the same frame.
      const proxy = iframe.contentWindow.browser;
      switch (apiId)
      {
        case "contentSettings.cookies":
          if ("contentSettings" in proxy)
          {
            // browser.contentSettings is not supported by webextension-polyfill
            // so we need to fall back to using callbacks as defined by Chrome
            proxy.contentSettings.cookies.get(...args, callback);
          }
          else
          {
            callback(null);
          }
          break;
        case "contentSettings.javascript":
          if ("contentSettings" in proxy)
          {
            // browser.contentSettings is not supported by webextension-polyfill
            // so we need to fall back to using callbacks as defined by Chrome
            proxy.contentSettings.javascript.get(...args, callback);
          }
          else
          {
            callback(null);
          }
          break;
        case "management.getAll":
          if ("getAll" in proxy.management)
          {
            proxy.management.getAll(...args).then(callback);
          }
          else
          {
            callback(null);
          }
          break;
      }
    };
    document.body.appendChild(iframe);
  });
}

function retrieveExtensions()
{
  return proxyApiCall("management.getAll")
    .then((installed) =>
    {
      const extensions = [];

      for (const extension of installed)
      {
        if (!extension.enabled || extension.type != "extension")
          continue;

        extensions.push({
          id: extension.id,
          name: extension.name,
          type: "extension",
          version: extension.version
        });
      }

      const {plugins} = navigator;
      for (const plugin of plugins)
      {
        extensions.push({
          id: plugin.filename,
          name: plugin.name,
          type: "plugin"
        });
      }

      return extensions;
    })
    .catch((err) =>
    {
      console.error("Could not retrieve list of extensions");
      return [];
    });
}

function retrieveOptions()
{
  // Firefox doesn't support browser.contentSettings API
  if (!("contentSettings" in browser))
    return Promise.resolve({});

  let tabId;
  try
  {
    tabId = getOriginalTabId();
  }
  catch (ex)
  {
    return Promise.reject(ex);
  }

  return browser.tabs.get(tabId)
    .then((tab) =>
    {
      const details = {primaryUrl: tab.url, incognito: tab.incognito};

      return Promise.all([
        proxyApiCall("contentSettings.cookies", details),
        proxyApiCall("contentSettings.javascript", details),
        tab.incognito
      ]);
    })
    .then(([cookies, javascript, incognito]) =>
    {
      return {
        cookieBehavior: cookies.setting == "allow" ||
          cookies.setting == "session_only",
        javascript: javascript.setting == "allow",
        privateBrowsing: incognito
      };
    })
    .catch((err) =>
    {
      console.error("Could not retrieve configuration options");
      return {};
    });
}

export function updateConfigurationInfo(isAccessible)
{
  if (!isAccessible)
  {
    setConfigurationInfo(null);
    return Promise.resolve();
  }

  return Promise.all([
    retrieveExtensions(),
    retrieveOptions()
  ])
  .then(([extensions, options]) =>
  {
    setConfigurationInfo({extensions, options});
  });
}

function capitalize(str)
{
  return str[0].toUpperCase() + str.slice(1);
}

function censorURL(url)
{
  return url.replace(/([?;&/#][^?;&/#]+?=)[^?;&/#]+/g, "$1*");
}

function setReportType(event)
{
  reportData.documentElement.setAttribute("type", event.target.value);
}

for (const typeElement of $$("#typeSelectorGroup input"))
{
  typeElement.addEventListener("change", setReportType);
}

let commentElement = null;
$("#comment").addEventListener("input", (event) =>
{
  const comment = event.target.value;
  if (!comment)
  {
    if (commentElement)
    {
      commentElement.parentNode.removeChild(commentElement);
      commentElement = null;
    }
  }
  else if (commentElement)
  {
    commentElement.textContent = comment;
  }
  else
  {
    commentElement = reportData.createElement("comment");
    commentElement.textContent = comment;
    reportData.documentElement.appendChild(commentElement);
  }
});

const anonSubmissionField = $("#anonymousSubmission");
const emailField = $("#email");
emailField.addEventListener("input", validateCommentsPage);
anonSubmissionField.addEventListener("click", validateCommentsPage);

const emailElement = reportData.createElement("email");
function validateCommentsPage()
{
  const sendButton = $("#send");
  $("#anonymousSubmissionWarning").setAttribute(
    "data-invisible",
    !anonSubmissionField.checked
  );
  if (anonSubmissionField.checked)
  {
    emailField.value = "";
    emailField.disabled = true;
    sendButton.disabled = !isMinimumTimeMet;
    if (emailElement.parentNode)
      emailElement.parentNode.removeChild(emailElement);
  }
  else
  {
    emailField.disabled = false;

    const value = emailField.value.trim();
    emailElement.textContent = value;
    reportData.documentElement.appendChild(emailElement);
    sendButton.disabled = (value == "" || !emailField.validity.valid ||
      !isMinimumTimeMet);
  }
  $("io-steps").dispatchEvent(
    new CustomEvent("formvalidated", {detail: !sendButton.disabled})
  );
}

export function collectData()
{
  let tabId;
  try
  {
    tabId = getOriginalTabId();
  }
  catch (ex)
  {
    return Promise.reject(ex);
  }

  return Promise.all([
    retrieveAddonInfo(),
    retrieveApplicationInfo(),
    retrievePlatformInfo(),
    retrieveWindowInfo(tabId),
    collectRequests(tabId),
    retrieveSubscriptions()
  ]).then(() => reportData);
}
