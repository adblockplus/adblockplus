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

function generateFilter(request, domainSpecific)
{
  var filter = request.url.replace(/^[\w\-]+:\/+(?:www\.)?/, "||");
  var options = [];

  if (request.type == "POPUP")
  {
    options.push("popup");

    if (request.url == "about:blank")
      domainSpecific = true;
  }

  if (domainSpecific)
    options.push("domain=" + request.docDomain);

  if (options.length > 0)
    filter += "$" + options.join(",");

  return filter;
}

function createActionButton(action, label, filter)
{
  var button = document.createElement("span");

  button.textContent = label;
  button.classList.add("action");

  button.addEventListener("click", function()
  {
    ext.backgroundPage.sendMessage({
      type: "filters." + action,
      text: filter
    });
  }, false);

  return button;
}

function createRecord(request, filter, template)
{
  var row = document.importNode(template, true);
  row.dataset.type = request.type;

  row.querySelector(".domain").textContent = request.docDomain;
  row.querySelector(".type").textContent = request.type;

  var urlElement = row.querySelector(".url");
  var actionWrapper = row.querySelector(".action-wrapper");

  if (request.url)
  {
    urlElement.textContent = request.url;

    if ("openResource" in ext.devtools.panels && request.type != "POPUP")
    {
      urlElement.classList.add("resourceLink");
      urlElement.addEventListener("click", function()
      {
        ext.devtools.panels.openResource(request.url);
      }, false);
    }
  }

  if (filter)
  {
    var filterElement = row.querySelector(".filter");
    var originElement = row.querySelector(".origin");

    filterElement.textContent = filter.text;
    row.dataset.state = filter.whitelisted ? "whitelisted" : "blocked";

    if (filter.subscription)
      originElement.textContent = filter.subscription;
    else
    {
      if (filter.userDefined)
        originElement.textContent = "user-defined";
      else
        originElement.textContent = "unnamed subscription";

      originElement.classList.add("unnamed");
    }

    if (!filter.whitelisted && request.type != "ELEMHIDE")
      actionWrapper.appendChild(createActionButton(
        "add", "Add exception", "@@" + generateFilter(request, false)
      ));

    if (filter.userDefined)
      actionWrapper.appendChild(createActionButton(
        "remove", "Remove rule", filter.text
      ));
  }
  else
    actionWrapper.appendChild(createActionButton(
      "add", "Block item", generateFilter(request, request.specificOnly)
    ));

  return row;
}

document.addEventListener("DOMContentLoaded", function()
{
  var container = document.getElementById("items");
  var table = container.querySelector("tbody");
  var template = document.querySelector("template").content.firstElementChild;

  document.getElementById("reload").addEventListener("click", function()
  {
    ext.devtools.inspectedWindow.reload();
  }, false);

  document.getElementById("filter-state").addEventListener("change", function(event)
  {
    container.dataset.filterState = event.target.value;
  }, false);

  document.getElementById("filter-type").addEventListener("change", function(event)
  {
    container.dataset.filterType = event.target.value;
  }, false);

  ext.onMessage.addListener(function(message)
  {
    switch (message.type)
    {
      case "add-record":
        table.appendChild(createRecord(message.request, message.filter, template));
        break;

      case "update-record":
        var oldRow = table.getElementsByTagName("tr")[message.index];
        var newRow = createRecord(message.request, message.filter, template);
        oldRow.parentNode.replaceChild(newRow, oldRow);
        newRow.classList.add("changed");
        container.classList.add("has-changes");
        break;

      case "remove-record":
        var row = table.getElementsByTagName("tr")[message.index];
        row.parentNode.removeChild(row);
        container.classList.add("has-changes");
        break;

      case "reset":
        table.innerHTML = "";
        container.classList.remove("has-changes");
        break;
    }
  });
}, false);
