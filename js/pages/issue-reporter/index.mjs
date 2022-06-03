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

import {convertDoclinks} from "../../common";
import {$, asIndentedString} from "../../dom";
import {initI18n, setElementLinks} from "../../i18n";
import {
  collectData,
  closeRequestsCollectingTab,
  updateConfigurationInfo
} from "./report";
import stepsManager from "./steps-manager";

const optionalPermissions = {
  permissions: [
    "contentSettings",
    "management"
  ]
};

convertDoclinks();
initI18n();

function containsPermissions()
{
  // Firefox doesn't trigger the promise's catch() but instead throws
  try
  {
    return browser.permissions.contains(optionalPermissions);
  }
  catch (ex)
  {
    return Promise.reject(ex);
  }
}

document.addEventListener("DOMContentLoaded", () =>
{
  const supportEmail = "support@adblockplus.org";
  setElementLinks("sr-warning", `mailto:${supportEmail}`);
  setElementLinks(
    "other-issues",
    `mailto:${supportEmail}?subject=${encodeURIComponent("[Issue Reporter]")}`
  );

  const cancelButton = $("#cancel");
  cancelButton.addEventListener("click", closeMe);
  $("#hide-notification").addEventListener("click", () =>
  {
    $("#notification").setAttribute("aria-hidden", true);
  });

  const collectedData = collectData().catch(e =>
  {
    console.error(e);
    alert(e);
    closeMe();
  });

  const manageSteps = browser.tabs.captureVisibleTab(null, {format: "png"})
    .then(screenshot =>
    {
      // activate current tab and let the user report
      return browser.tabs.getCurrent()
        .then(tab => browser.tabs.update(tab.id, {active: true}))
        .then(() => stepsManager({screenshot}));
    });

  $("#send").addEventListener("click", function sendAll(event)
  {
    const sendButton = event.currentTarget;
    const lastStep = $("io-steps button:last-child");
    sendButton.removeEventListener("click", sendAll);
    sendButton.disabled = true;
    lastStep.disabled = false;
    lastStep.click();
    $("io-highlighter").addEventListener("changecolordepth", evt =>
    {
      const progress = $("#sendingProgress");
      const {max, value} = evt.detail;
      // do not fulfill the bar with this info only
      // the idea is to show a general progress for
      // both the color depth and the sending report
      progress.max = max * 2;
      progress.value = value;
    });
    Promise.all([collectedData, manageSteps]).then(results =>
    {
      // At this point the report is sent,
      // and there will be a link within an iframe
      // that navigates, within the same page, to the
      // reported issue online.
      // Without removing the beforeunload callback,
      // and because the page is the current tab,
      // the user won't be able to reach the report,
      // because the tab itself would close instead.
      window.removeEventListener("beforeunload", closeMe);
      cancelButton.disabled = true;
      cancelButton.hidden = true;
      sendReport(reportWithScreenshot(...results));
      sendButton.textContent =
        browser.i18n.getMessage("issueReporter_closeButton_label");
      $("io-steps").setCompleted(-1, true);
    });
  });

  // We query our permissions here to find out whether the browser supports them
  containsPermissions()
    .then(() =>
    {
      const includeConfig = $("#includeConfig");
      includeConfig.addEventListener("change", (event) =>
      {
        if (!includeConfig.checked)
        {
          updateConfigurationInfo(false);
          return;
        }

        event.preventDefault();

        browser.permissions.request(optionalPermissions)
          .then((granted) =>
          {
            return updateConfigurationInfo(granted)
              .then(() =>
              {
                includeConfig.checked = granted;
              });
          })
          // Catch error here already to ensure permission is removed
          // even if we are unable to update the report data
          .catch(console.error)
          .then(() => browser.permissions.remove(optionalPermissions))
          .then((success) =>
          {
            if (!success)
              throw new Error("Failed to remove permissions");
          })
          .catch(console.error);
      });
    })
    .catch((err) =>
    {
      // No need to ask for more data if we won't be able to access it anyway
      const includeConfig = $("#includeConfigContainer");
      includeConfig.hidden = true;
    });

  const showDataOverlay = $("#showDataOverlay");
  $("#showData").addEventListener("click", event =>
  {
    event.preventDefault();

    collectedData.then(
      xmlReport =>
      {
        closeRequestsCollectingTab().then(() =>
        {
          showDataOverlay.hidden = false;

          reportWithScreenshot(xmlReport, {screenshot: $("io-highlighter")});
          const element = $("#showDataValue");
          element.textContent = asIndentedString(xmlReport);
          element.focus();
        });
      }
    );
  });
  $("#showDataClose").addEventListener("click", event =>
  {
    showDataOverlay.hidden = true;
    $("#showData").focus();
  });
});

let notifyClosing = true;
window.addEventListener("beforeunload", closeMe);
function closeMe()
{
  if (notifyClosing)
  {
    notifyClosing = false;
    browser.runtime.sendMessage({
      type: "app.get",
      what: "senderId"
    }).then(tabId => browser.tabs.remove(tabId));
  }
}

function reportWithScreenshot(xmlReport, stepsData)
{
  const {edited, data} = stepsData.screenshot;
  const element = $("screenshot", xmlReport.documentElement) ||
                  xmlReport.createElement("screenshot");
  element.setAttribute("edited", edited);
  const proc = browser.i18n.getMessage("issueReporter_processing_screenshot");
  element.textContent = data || `data:image/png;base64,...${proc}...`;
  xmlReport.documentElement.appendChild(element);
  return xmlReport;
}

function generateUUID(size = 8)
{
  const uuid = new Uint16Array(size);
  window.crypto.getRandomValues(uuid);
  uuid[3] = uuid[3] & 0x0FFF | 0x4000;  // version 4
  uuid[4] = uuid[4] & 0x3FFF | 0x8000;  // variant 1

  const uuidChunks = [];
  for (let i = 0; i < uuid.length; i++)
  {
    const component = uuid[i].toString(16);
    uuidChunks.push(("000" + component).slice(-4));
    if (i >= 1 && i <= 4)
      uuidChunks.push("-");
  }
  return uuidChunks.join("");
}

function sendReport(reportData)
{
  // Passing a sequence to URLSearchParams() constructor only works starting
  // with Firefox 53, add values "manually" for now.
  const params = new URLSearchParams();
  for (const [param, value] of [
    ["version", 1],
    ["guid", generateUUID()],
    ["lang", $("adblock-plus", reportData)
                       .getAttribute("locale")]
  ])
  {
    params.append(param, value);
  }

  const url = "https://reports.adblockplus.org/submitReport?" + params;

  const reportSent = event =>
  {
    let success = false;
    let errorMessage = browser.i18n.getMessage(
      "filters_subscription_lastDownload_connectionError"
    );
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
      const errorElement = document.getElementById("error");
      const template = browser.i18n.getMessage("issueReporter_errorMessage")
                                    .replace(/[\r\n\s]+/g, " ");

      const [, before, linkText, after] =
              /(.*)\[link\](.*)\[\/link\](.*)/.exec(template) ||
              [null, "", template, ""];
      const beforeLink = before.replace(/\?1\?/g, errorMessage);
      const afterLink = after.replace(/\?1\?/g, errorMessage);

      while (errorElement.firstChild)
        errorElement.removeChild(errorElement.firstChild);

      const link = document.createElement("a");
      link.textContent = linkText;
      browser.runtime.sendMessage({
        type: "app.get",
        what: "doclink",
        link: "reporter_connect_issue"
      }).then(supportUrl =>
      {
        link.href = supportUrl;
      });


      errorElement.appendChild(document.createTextNode(beforeLink));
      errorElement.appendChild(link);
      errorElement.appendChild(document.createTextNode(afterLink));

      errorElement.hidden = false;
    }

    result = result.replace(
      /%CONFIRMATION%/g,
      encodeHTML(browser.i18n.getMessage("issueReporter_confirmationMessage"))
    );
    result = result.replace(
      /%KNOWNISSUE%/g,
      encodeHTML(browser.i18n.getMessage("issueReporter_knownIssueMessage"))
    );
    const {direction} = window.getComputedStyle(document.documentElement, "");
    result = result.replace(
      /(<html)\b/,
      `$1 dir="${encodeHTML(direction)}"`
    );

    document.getElementById("sendReportMessage").hidden = true;
    document.getElementById("sendingProgressContainer").hidden = true;

    const resultFrame = document.getElementById("result");
    resultFrame.setAttribute("src", "data:text/html;charset=utf-8," +
                                    encodeURIComponent(result));
    resultFrame.hidden = false;

    document.getElementById("continue").disabled = false;

    if (success)
    {
      $("#send").disabled = false;
      $("#send").addEventListener("click", closeMe);
    }
  };

  const request = new XMLHttpRequest();
  request.open("POST", url);
  request.setRequestHeader("Content-Type", "text/xml");
  request.setRequestHeader("X-Adblock-Plus", "1");
  request.addEventListener("load", reportSent);
  request.addEventListener("error", reportSent);
  const progress = document.getElementById("sendingProgress");
  request.upload.addEventListener("progress", event =>
  {
    if (!event.lengthComputable)
      return;

    if (event.loaded > 0)
    {
      // normalize the ratio between previous loading and the current one
      // previous one stopped at 50, so it starts from 50
      progress.max = 100;
      progress.value = 50 + (50 * event.loaded) / event.total;
    }
  });
  request.send(asIndentedString(reportData));
}

function encodeHTML(str)
{
  return str.replace(/[&<>"]/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[c]));
}
