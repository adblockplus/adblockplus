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

const reportData = new DOMParser().parseFromString("<report></report>",
                                                 "text/xml");
let dataGatheringTabId = null;
let isMinimumTimeMet = false;
const port = browser.runtime.connect({name: "ui"});

port.onMessage.addListener((message) =>
{
  switch (message.type)
  {
    case "requests.respond":
      switch (message.action)
      {
        case "hits":
          const [request, filter, subscriptions] = message.args;
          const requestsContainerElem = reportData.querySelector("requests");
          const filtersElem = reportData.querySelector("filters");
          // ELEMHIDE hitLog request doesn't contain url
          if (request.url)
          {
            let requestElem = reportData
                                .querySelector(`[location="${request.url}"]`);
            if (requestElem)
            {
              const countNum = parseInt(
                requestElem.getAttribute("count"), 10
              );
              requestElem.setAttribute("count", countNum + 1);
            }
            else
            {
              requestElem = reportData.createElement("request");
              requestElem.setAttribute("location", censorURL(request.url));
              requestElem.setAttribute("type", request.type);
              requestElem.setAttribute("docDomain", request.docDomain);
              requestElem.setAttribute("thirdParty", request.thirdParty);
              requestElem.setAttribute("count", 1);
              requestsContainerElem.appendChild(requestElem);
            }
            if (filter)
              requestElem.setAttribute("filter", filter.text);
          }
          if (filter)
          {
            const existingFilter = reportData
                                    .querySelector(`[text='${filter.text}']`);
            if (existingFilter)
            {
              const countNum = parseInt(existingFilter.getAttribute("hitCount"),
                                      10);
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

module.exports = {
  closeRequestsCollectingTab,
  collectData()
  {
    const tabId = parseInt(location.search.replace(/^\?/, ""), 10);

    if (!tabId)
      return Promise.reject(new Error("invalid tab id"));

    return Promise.all([
      retrieveAddonInfo(),
      retrieveApplicationInfo(),
      retrievePlatformInfo(),
      retrieveTabURL(tabId),
      collectRequests(tabId),
      retrieveSubscriptions(),
      retrieveLanguage(tabId)
    ]).then(() => reportData);
  }
};

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
    port.postMessage({
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
      document.querySelector("io-steps")
              .dispatchEvent(new CustomEvent("requestcollected"));
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
function closeRequestsCollectingTab()
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

function retrieveLanguage(tabId)
{
  const element = reportData.createElement("detectedLanguage");
  return new Promise(resolve =>
  {
    browser.tabs.detectLanguage(tabId, language =>
    {
      element.setAttribute("value", language);
      reportData.documentElement.appendChild(element);
      resolve();
    });
  });
}

function retrievePlatformInfo()
{
  const element = reportData.createElement("platform");
  return browser.runtime.sendMessage({
    type: "app.get",
    what: "platform"
  }).then(platform =>
  {
    element.setAttribute("name", capitalize(platform));
    return browser.runtime.sendMessage({
      type: "app.get",
      what: "platformVersion"
    });
  }).then(platformVersion =>
  {
    element.setAttribute("version", platformVersion);
    reportData.documentElement.appendChild(element);
  });
}

function retrieveTabURL(tabId)
{
  return browser.tabs.get(tabId).then(tab =>
  {
    const element = reportData.createElement("window");
    if (tab.url)
      element.setAttribute("url", censorURL(tab.url));
    reportData.documentElement.appendChild(element);
  });
}

function retrieveSubscriptions()
{
  return browser.runtime.sendMessage({
    type: "subscriptions.get",
    ignoreDisabled: true,
    downloadable: true,
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

for (const typeElement of document.querySelectorAll("#typeSelectorGroup input"))
{
  typeElement.addEventListener("change", setReportType);
}

let commentElement = null;
document.querySelector("#comment").addEventListener("input", (event) =>
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

const anonSubmissionField = document.querySelector("#anonymousSubmission");
const emailField = document.querySelector("#email");
emailField.addEventListener("input", validateCommentsPage);
anonSubmissionField.addEventListener("click", validateCommentsPage);

const emailElement = reportData.createElement("email");
function validateCommentsPage()
{
  const sendButton = document.querySelector("#send");
  document.querySelector("#anonymousSubmissionWarning")
          .setAttribute("data-invisible", !anonSubmissionField.checked);
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
  document.querySelector("io-steps")
          .dispatchEvent(new CustomEvent("formvalidated",
                        {detail: !sendButton.disabled}));
}
