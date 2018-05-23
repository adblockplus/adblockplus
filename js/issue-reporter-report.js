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
      retrieveSubscriptions()
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

function closeRequestsCollectingTab()
{
  return browser.tabs.remove(dataGatheringTabId);
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
