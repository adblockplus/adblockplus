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

window.ext = {};

let reportData = new DOMParser().parseFromString("<report></report>", "text/xml");

let pages = {
  "typeSelectorPage": [initTypeSelector, leaveTypeSelector],
  "commentPage": [initCommentPage, leaveCommentPage],
  "sendPage": [initSendPage, leaveSendPage]
};

document.addEventListener("DOMContentLoaded", () =>
{
  document.getElementById("cancel").addEventListener("click", () =>
  {
    window.close();
  });

  document.getElementById("continue").addEventListener("click", () =>
  {
    if (!document.getElementById("continue").disabled)
      pages[getCurrentPage()][1]();
  });

  document.addEventListener("keydown", event =>
  {
    let blacklistedElements = new Set(["textarea", "button", "a"])

    if (event.key == "Enter" && !blacklistedElements.has(event.target.localName))
      document.getElementById("continue").click();
    else if (event.key == "Escape")
      document.getElementById("cancel").click();
  });

  browser.runtime.sendMessage({
    type: "app.get",
    what: "doclink",
    link: "reporter_privacy"
  }).then(url =>
  {
    document.getElementById("privacyPolicy").href = url;
  });

  initDataCollector();
});

function getCurrentPage()
{
  return document.querySelector(".page:not([hidden])").id;
}

function setCurrentPage(pageId)
{
  if (!pages.hasOwnProperty(pageId))
    return;

  let previousPage = document.querySelector(".page:not([hidden])");
  if (previousPage)
    previousPage.hidden = true;

  document.getElementById(pageId).hidden = false;
  pages[pageId][0]();
}

function censorURL(url)
{
  return url.replace(/([?;&\/#][^?;&\/#]+?=)[^?;&\/#]+/g, "$1*");
}

function encodeHTML(str)
{
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function serializeReportData()
{
  let result = new XMLSerializer().serializeToString(reportData);

  // Insert line breaks before each new tag
  result = result.replace(/(<[^\/]([^"<>]*|"[^"]*")*>)/g, "\n$1");
  result = result.replace(/^\n+/, "");
  return result;
}

function retrieveAddonInfo()
{
  let element = reportData.createElement("adblock-plus");
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
  let element = reportData.createElement("application");
  return browser.runtime.sendMessage({
    type: "app.get",
    what: "application"
  }).then(application =>
  {
    element.setAttribute("name", application);
    return browser.runtime.sendMessage({
      type: "app.get",
      what: "applicationVersion"
    });
  }).then(applicationVersion =>
  {
    element.setAttribute("version", applicationVersion);
    element.setAttribute("userAgent", navigator.userAgent);
    reportData.documentElement.appendChild(element);
  });
}

function retrievePlatformInfo()
{
  let element = reportData.createElement("platform");
  return browser.runtime.sendMessage({
    type: "app.get",
    what: "platform"
  }).then(platform =>
  {
    element.setAttribute("name", platform);
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
    let element = reportData.createElement("window");
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
    downloadable: true
  }).then(subscriptions =>
  {
    let element = reportData.createElement("subscriptions");
    for (let subscription of subscriptions)
    {
      if (!/^(http|https|ftp):/.test(subscription.url))
        continue;

      let now = Math.round(Date.now() / 1000);
      let subscriptionElement = reportData.createElement("subscription");
      subscriptionElement.setAttribute("id", subscription.url);
      if (subscription.lastDownload)
        subscriptionElement.setAttribute("lastDownloadAttempt", subscription.lastDownload - now);
      subscriptionElement.setAttribute("downloadStatus", subscription.downloadStatus);
      element.appendChild(subscriptionElement);
    }
    reportData.documentElement.appendChild(element);
  });
}

function initDataCollector()
{
  Promise.resolve().then(() =>
  {
    let tabId = parseInt(location.search.replace(/^\?/, ""), 10) || 0;
    let handlers = [
      retrieveAddonInfo(),
      retrieveApplicationInfo(),
      retrievePlatformInfo(),
      retrieveTabURL(tabId),
      retrieveSubscriptions()
    ];
    return Promise.all(handlers);
  }).then(() =>
  {
    setCurrentPage("typeSelectorPage");
  }).catch(e =>
  {
    if (!e.name && e.message)
      e = e.message;
    alert(e);
    window.close();
  });
}

function initTypeSelector()
{
  document.getElementById("typeFalsePositive").focus();


  for (let checkbox of document.querySelectorAll("input[name='type']"))
  {
    checkbox.addEventListener("click", () =>
    {
      if (document.querySelector("input[name='type']:checked"))
        document.getElementById("continue").disabled = false;
    });
  }
}

function leaveTypeSelector()
{
  let checkbox = document.querySelector("input[name='type']:checked");
  reportData.documentElement.setAttribute("type", checkbox.value);
  setCurrentPage("commentPage");
}

function initCommentPage()
{
  let continueButton = document.getElementById("continue");
  continueButton.disabled = true;
  continueButton.textContent = browser.i18n.getMessage("issueReporter_sendButton_label");

  let emailElement = reportData.createElement("email");
  let emailField = document.getElementById("email");
  let anonymousSubmissionField = document.getElementById("anonymousSubmission");
  let validateEmail = () =>
  {
    document.getElementById("anonymousSubmissionWarning").setAttribute("data-invisible", !anonymousSubmissionField.checked);
    if (anonymousSubmissionField.checked)
    {
      emailField.value = "";
      emailField.disabled = true;
      continueButton.disabled = false;
      if (emailElement.parentNode)
        emailElement.parentNode.removeChild(emailElement);
    }
    else
    {
      emailField.disabled = false;

      let value = emailField.value.trim();
      emailElement.textContent = value;
      reportData.documentElement.appendChild(emailElement);
      continueButton.disabled = value == "" || !emailField.validity.valid;
    }
  };
  emailField.addEventListener("input", validateEmail);
  anonymousSubmissionField.addEventListener("click", validateEmail);

  let commentElement = reportData.createElement("comment");
  document.getElementById("comment").addEventListener("input", event =>
  {
    if (commentElement.parentNode)
      commentElement.parentNode.removeChild(commentElement);

    let value = event.target.value.trim();
    commentElement.textContent = value.substr(0, 1000);
    if (value)
      reportData.documentElement.appendChild(commentElement);
    document.getElementById("commentLengthWarning").setAttribute("data-invisible", value.length <= 1000);
  });

  document.getElementById("showData").addEventListener("click", event =>
  {
    event.preventDefault();

    // window.open() won't open data: URIs in Chrome
    browser.tabs.getCurrent().then(tab =>
    {
      browser.tabs.create({
        url: "data:text/xml;charset=utf-8," + encodeURIComponent(serializeReportData()),
        openerTabId: tab.id
      });
    })
  });

  emailField.focus();
}

function leaveCommentPage()
{
  setCurrentPage("sendPage");
}

function initSendPage()
{
  document.getElementById("cancel").hidden = true;

  let continueButton = document.getElementById("continue");
  continueButton.textContent = browser.i18n.getMessage("issueReporter_doneButton_label");
  continueButton.disabled = true;

  let uuid = new Uint16Array(8);
  window.crypto.getRandomValues(uuid);
  uuid[3] = uuid[3] & 0x0FFF | 0x4000;  // version 4
  uuid[4] = uuid[4] & 0x3FFF | 0x8000;  // variant 1

  let uuidString = "";
  for (let i = 0; i < uuid.length; i++)
  {
    let component = uuid[i].toString(16);
    while (component.length < 4)
      component = "0" + component;
    uuidString += component;
    if (i >= 1 && i<= 4)
      uuidString += "-";
  }

  let params = new URLSearchParams({
    version: 1,
    guid: uuidString,
    lang: reportData.getElementsByTagName("adblock-plus")[0].getAttribute("locale")
  });
  let url = "https://reports.adblockplus.org/submitReport?" + params;

  let reportSent = event =>
  {
    let success = false;
    let errorMessage = browser.i18n.getMessage("filters_subscription_lastDownload_connectionError");
    try
    {
      success = request.status == 200;
      if (request.status != 0)
        errorMessage = request.status + " " + request.statusText;
    }
    catch (e)
    {
      // Getting request status might throw if no connection was established
    }

    let result;
    try
    {
      result = request.responseText;
    }
    catch (e)
    {
      result = "";
    }

    if (!success)
    {
      let errorElement = document.getElementById("error");
      let template = browser.i18n.getMessage("issueReporter_errorMessage").replace(/[\r\n\s]+/g, " ");

      let [, beforeLink, linkText, afterLink] = /(.*)\[link\](.*)\[\/link\](.*)/.exec(template) || [null, "", template, ""];
      beforeLink = beforeLink.replace(/\?1\?/g, errorMessage);
      afterLink = afterLink.replace(/\?1\?/g, errorMessage);

      while (errorElement.firstChild)
        errorElement.removeChild(errorElement.firstChild);

      let link = document.createElement("a");
      link.textContent = linkText;
      browser.runtime.sendMessage({
        type: "app.get",
        what: "doclink",
        link: "reporter_connect_issue"
      }).then(url =>
      {
        link.href = url;
      });


      errorElement.appendChild(document.createTextNode(beforeLink));
      errorElement.appendChild(link);
      errorElement.appendChild(document.createTextNode(afterLink));

      errorElement.hidden = false;
    }

    result = result.replace(/%CONFIRMATION%/g, encodeHTML(browser.i18n.getMessage("issueReporter_confirmationMessage")));
    result = result.replace(/%KNOWNISSUE%/g, encodeHTML(browser.i18n.getMessage("issueReporter_knownIssueMessage")));
    result = result.replace(/(<html)\b/, '$1 dir="' + encodeHTML(window.getComputedStyle(document.documentElement, "").direction + '"'));

    document.getElementById("sendReportMessage").hidden = true;
    document.getElementById("sendingProgressContainer").hidden = true;

    let resultFrame = document.getElementById("result");
    resultFrame.setAttribute("src", "data:text/html;charset=utf-8," + encodeURIComponent(result));
    resultFrame.hidden = false;

    document.getElementById("continue").disabled = false;
  };

  let request = new XMLHttpRequest();
  request.open("POST", url);
  request.setRequestHeader("Content-Type", "text/xml");
  request.setRequestHeader("X-Adblock-Plus", "1");
  request.addEventListener("load", reportSent);
  request.addEventListener("error", reportSent);
  request.upload.addEventListener("progress", event =>
  {
    if (!event.lengthComputable)
      return;

    let progress = Math.round(event.loaded / event.total * 100);
    if (event.loaded > 0)
    {
      let progress = document.getElementById("sendingProgress");
      progress.max = event.total;
      progress.value = event.loaded;
    }
  });
  request.send(serializeReportData());
}

function leaveSendPage()
{
  window.close();
}
