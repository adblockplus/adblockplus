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

/* globals getErrorMessage */

"use strict";

let targetPageId = null;
const {stripTagsUnsafe} = ext.i18n;

function onKeyDown(event)
{
  if (event.keyCode == 27)
  {
    event.preventDefault();
    closeDialog();
  }
}

function addFilters()
{
  const textarea = document.getElementById("filters");
  browser.runtime.sendMessage({
    type: "filters.importRaw",
    text: textarea.value
  }).then((errors) =>
  {
    if (errors.length > 0)
    {
      errors = errors.map(getErrorMessage);
      alert(stripTagsUnsafe(errors.join("\n")));
    }
    else
      closeDialog(true);
  });
}

// We'd rather just call window.close, but that isn't working consistently with
// Firefox 57, even when allowScriptsToClose is passed to browser.windows.create
// See https://bugzilla.mozilla.org/show_bug.cgi?id=1418394
function closeMe()
{
  browser.runtime.sendMessage({
    type: "app.get",
    what: "senderId"
  }).then(tabId => browser.tabs.remove(tabId));
}

function closeDialog(success = false)
{
  browser.runtime.sendMessage({
    type: "composer.forward",
    targetPageId,
    payload:
    {
      type: "composer.content.finished",
      popupAlreadyClosed: true,
      remove: !!success
    }
  });
  closeMe();
}

function resetFilters()
{
  browser.tabs.sendMessage(targetPageId, {
    type: "composer.content.finished"
  }).then(() =>
  {
    browser.tabs.sendMessage(targetPageId, {
      type: "composer.content.startPickingElement"
    }).then(closeMe);
  });
}

function previewFilters({currentTarget})
{
  const {preview} = currentTarget.dataset;
  const isActive = preview === "active";
  browser.runtime.sendMessage({
    type: "composer.forward",
    targetPageId,
    payload:
    {
      type: "composer.content.preview",
      active: !isActive
    }
  }).then(() =>
  {
    currentTarget.dataset.preview = isActive ? "inactive" : "active";
    currentTarget.textContent =
      browser.i18n.getMessage(
        isActive ? "composer_undo_preview" : "composer_preview"
      );
  });
}

function init()
{
  // Attach event listeners
  window.addEventListener("keydown", onKeyDown, false);

  const block = document.getElementById("block");
  block.addEventListener("click", addFilters);

  const preview = document.getElementById("preview");
  preview.addEventListener("click", previewFilters);

  document.getElementById("unselect").addEventListener("click", resetFilters);
  document.getElementById("cancel").addEventListener(
    "click", closeDialog.bind(null, false)
  );

  ext.onMessage.addListener((msg, sender, sendResponse) =>
  {
    switch (msg.type)
    {
      case "composer.dialog.init":
        targetPageId = msg.sender;
        const filtersTextArea = document.getElementById("filters");
        filtersTextArea.value = msg.filters.join("\n");
        filtersTextArea.disabled = false;
        preview.disabled = false;
        block.disabled = false;
        block.focus();
        document.getElementById("selected").dataset.count = msg.highlights;

        // Firefox sometimes tells us this window had loaded before it has[1],
        // to work around that we send the "composer.dialog.init" message again
        // when sending failed. Unfortunately sometimes sending is reported as
        // successful when it's not, but with the response of `undefined`. We
        // therefore send a response here, and check for it to see if the
        // message really was sent successfully.
        // [1] - https://bugzilla.mozilla.org/show_bug.cgi?id=1418655
        sendResponse(true);
        break;
      case "composer.dialog.close":
        closeMe();
        break;
    }
  });

  window.removeEventListener("load", init);

  // fixes inconsistent popup size across browsers
  const {innerWidth, innerHeight} = window;
  window.resizeBy(600 - innerWidth, 300 - innerHeight);
}

window.addEventListener("load", init, false);
