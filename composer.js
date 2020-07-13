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

let initialFilterText = "";
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
// window.close is also broken on Firefox 63.x
// See https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/-/issues/791#note_374617568
function closeMe()
{
  browser.runtime.sendMessage({
    type: "app.get",
    what: "senderId"
  }).then(tabId =>
    browser.tabs.remove(tabId).catch(err =>
    {
      // Opera 68 throws a "Tabs cannot be edited right now (user may be
      // dragging a tab)." exception when we attempt to close the window
      // using `browser.tabs.remove`.
      window.close();
    })
  );
}

function closeDialog(success = false)
{
  document.getElementById("filters").disabled = true;
  browser.runtime.sendMessage({
    type: "composer.forward",
    targetPageId,
    payload:
    {
      type: "composer.content.finished",
      popupAlreadyClosed: true,
      remove: !!success
    }
  }).then(() =>
  {
    closeMe();
  });
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
  const wasActive = preview === "active";

  const filtersTextArea = document.getElementById("filters");

  // if it is inactive, disable the textarea upfront
  if (!wasActive)
    filtersTextArea.disabled = true;

  browser.runtime.sendMessage({
    type: "composer.forward",
    targetPageId,
    payload:
    {
      type: "composer.content.preview",
      // toggle the preview mode
      active: !wasActive
    }
  }).then(() =>
  {
    // if it was active, it's now inactive so the area should be editable
    if (wasActive)
      filtersTextArea.disabled = false;

    // toggle both data-preview and the button message accordingly
    currentTarget.dataset.preview = wasActive ? "inactive" : "active";
    currentTarget.textContent =
      browser.i18n.getMessage(
        wasActive ? "composer_preview" : "composer_undo_preview"
      );
  });
}

function updateComposerState({currentTarget})
{
  const {value} = currentTarget;
  const disabled = !value.trim().length;
  document.getElementById("block").disabled = disabled;
  document.getElementById("preview").disabled = initialFilterText !== value;
}

function init()
{
  // Attach event listeners
  window.addEventListener("keydown", onKeyDown, false);

  const block = document.getElementById("block");
  block.addEventListener("click", addFilters);

  const preview = document.getElementById("preview");
  preview.addEventListener("click", previewFilters);

  const filtersTextArea = document.getElementById("filters");
  filtersTextArea.addEventListener("input", updateComposerState);

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
        initialFilterText = msg.filters.join("\n");
        filtersTextArea.value = initialFilterText;
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
}

window.addEventListener("load", init, false);
