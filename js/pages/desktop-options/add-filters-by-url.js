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

const {$} = require("../../dom");

let ignoreFocus = false;

module.exports = {
  closeAddFiltersByURL()
  {
    // if not closed, gives back the focus to the opener being sure it'll close
    if (!isClosed())
    {
      ignoreFocus = false;
      $("[data-action='open-filterlist-by-url']").focus();
    }
  },
  setupAddFiltersByURL()
  {
    const wrapper = $("#filterlist-by-url-wrap");
    wrapper.addEventListener("blur", filtersBlur, true);
    wrapper.addEventListener("keydown", filtersKeydown);

    const opener = $("[data-action='open-filterlist-by-url']", wrapper);
    opener.addEventListener("mousedown", filtersToggle);
    opener.addEventListener("focus", filtersToggle);
    opener.addEventListener("keydown", openerKeys);

    const input = $("input[type='url']", wrapper);
    input.addEventListener("keyup", checkIfValid);
  }
};

function checkIfValid(event)
{
  const {currentTarget} = event;
  const isValid = currentTarget.checkValidity();

  currentTarget.setAttribute("aria-invalid", !isValid);

  let errorText = "";
  if (!isValid)
  {
    const url = currentTarget.value;
    if (url)
    {
      let errorId = null;
      if (!(new RegExp(currentTarget.pattern).test(url)))
      {
        errorId = "options_dialog_import_subscription_location_error_protocol";
      }
      else
      {
        errorId = "options_dialog_import_subscription_location_error";
      }
      errorText = browser.i18n.getMessage(errorId);
    }
  }
  $("#import-list-url ~ .error-msg").textContent = errorText;
}

function filtersBlur()
{
  // needed to ensure there is an eventually focused element to check
  // it sets aria-hidden when focus moves elsewhere
  setTimeout(
    (wrapper) =>
    {
      const {activeElement} = document;
      if (!activeElement || !wrapper.contains(activeElement))
      {
        filtersClose();
      }
    },
    0,
    $("#filterlist-by-url-wrap")
  );
}

function filtersClose()
{
  $("#filterlist-by-url").setAttribute("aria-hidden", "true");
}

function filtersKeydown(event)
{
  // We're only interested in dialog-internal key presses so we ignore any
  // that we might get while the dialog is closed
  if (isClosed())
    return;

  const {key} = event;
  if (key !== "Enter" && key !== "Escape")
    return;

  event.preventDefault();
  event.stopPropagation();

  switch (key)
  {
    case "Enter":
      $("[data-action='validate-import-subscription']").click();
      break;
    case "Escape":
      $("[data-action='open-filterlist-by-url']").focus();
      filtersClose();
      break;
  }
}

function filtersOpen()
{
  const element = $("#filterlist-by-url");
  element.removeAttribute("aria-hidden");
  $("input[type='url']", element).focus();
}

function filtersToggle(event)
{
  // prevent mousedown + focus to backfire
  if (ignoreFocus)
  {
    ignoreFocus = false;
    return;
  }

  const {currentTarget} = event;
  const {activeElement} = document;
  ignoreFocus = event.type === "mousedown" && currentTarget !== activeElement;

  if (isClosed())
  {
    event.preventDefault();
    filtersOpen();
  }
  else
  {
    filtersClose();
  }
}

function isClosed()
{
  return $("#filterlist-by-url").getAttribute("aria-hidden") === "true";
}

function openerKeys(event)
{
  switch (event.key)
  {
    case " ":
    case "Enter":
      ignoreFocus = false;
      filtersToggle(event);
      break;
  }
}
