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

/** @module browserAction */

import {TabSessionStorage} from "./storage/tab-session.js";

let badgeStateByPage = new TabSessionStorage("browserAction:blockedState");
let changesByPage = new TabSessionStorage("browserAction:changes");

async function setBadgeState(tabId, key, value)
{
  return badgeStateByPage.transaction(async() =>
  {
    let badgeState = await badgeStateByPage.get(tabId);

    if (!badgeState)
    {
      badgeState = {
        hiddenState: "visible",
        text: ""
      };
    }

    // We need to ignore any text changes while we're hiding the badge
    if (!(badgeState.hiddenState == "hiding" && key == "text"))
      badgeState[key] = value;

    await badgeStateByPage.set(tabId, badgeState);

    return badgeState;
  });
}

function applyChanges(tabId, changes)
{
  return Promise.all(Object.keys(changes).map(async change =>
  {
    // Firefox for Android displays the browser action not as an icon but
    // as a menu item. There is no icon, but such an option may be added
    // in the future.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1331746
    if (change == "iconPath" && "setIcon" in browser.action)
    {
      return browser.action.setIcon({
        tabId,
        path: {
          16: changes.iconPath.replace("$size", "16"),
          20: changes.iconPath.replace("$size", "20"),
          32: changes.iconPath.replace("$size", "32"),
          40: changes.iconPath.replace("$size", "40")
        }
      });
    }

    if (change == "iconImageData" && "setIcon" in browser.action)
    {
      return browser.action.setIcon({
        tabId,
        imageData: changes.iconImageData
      });
    }

    // There is no badge on Firefox for Android; the browser action is
    // simply a menu item.
    if (change == "badgeText" && "setBadgeText" in browser.action)
    {
      // Remember changes to the badge text but don't apply them yet
      // as long as the badge is hidden.
      let badgeState = await setBadgeState(tabId, "text", changes.badgeText);
      if (badgeState.hiddenState == "hidden")
        return;

      return browser.action.setBadgeText({
        tabId,
        text: changes.badgeText
      });
    }

    // There is no badge on Firefox for Android; the browser action is
    // simply a menu item.
    if (change == "badgeColor" &&
        "setBadgeBackgroundColor" in browser.action)
    {
      return browser.action.setBadgeBackgroundColor({
        tabId,
        color: changes.badgeColor
      });
    }
  }));
}

function addChange(tabId, name, value)
{
  void changesByPage.transaction(async() =>
  {
    const changes = (await changesByPage.get(tabId)) || {};
    changes[name] = value;
    await changesByPage.set(tabId, changes);

    try
    {
      await applyChanges(tabId, changes);
      await changesByPage.delete(tabId);
    }
    catch (e)
    {
      // If the tab is prerendered, browser.action.set* fails
      // and we have to delay our changes until the currently visible tab
      // is replaced with the prerendered tab.
    }
  });
}

function onReplaced(addedTabId)
{
  void changesByPage.transaction(async() =>
  {
    const changes = await changesByPage.get(addedTabId);
    if (!changes)
      return;

    try
    {
      await applyChanges(addedTabId, changes);
    }
    catch (e)
    {
      // Ignore if we fail to apply the changes
    }

    await changesByPage.delete(addedTabId);
  });
}
// If the tab is prerendered, browser.action.set* fails
// and we have to delay our changes until the currently visible tab
// is replaced with the prerendered tab.
browser.tabs.onReplaced.addListener(onReplaced);

/**
 * Sets icon badge for given tab.
 *
 * @param {number} tabId
 * @param {object} badge
 * @param {string} badge.color
 * @param {string} badge.number
 */
export function setBadge(tabId, badge)
{
  if (!badge)
  {
    addChange(tabId, "badgeText", "");
  }
  else
  {
    if ("number" in badge)
      addChange(tabId, "badgeText", badge.number.toString());

    if ("color" in badge)
      addChange(tabId, "badgeColor", badge.color);
  }
}

/**
 * Sets icon image for given tab using image data.
 *
 * @param  {number} tabId
 * @param  {object} imageData
 */
export function setIconImageData(tabId, imageData)
{
  addChange(tabId, "iconImageData", imageData);
}

/**
 * Sets icon image for given tab using file path.
 *
 * @param  {number} tabId
 * @param  {string} path - expected to include "$size" placeholder
 */
export function setIconPath(tabId, path)
{
  addChange(tabId, "iconPath", path);
}

/**
 * Toggles icon badge for given tab.
 *
 * @param  {number} tabId
 * @param  {boolean} shouldHide
 */
export async function toggleBadge(tabId, shouldHide)
{
  if (shouldHide)
  {
    await setBadgeState(tabId, "hiddenState", "hiding");
    addChange(tabId, "badgeText", "");
    await setBadgeState(tabId, "hiddenState", "hidden");
  }
  else
  {
    let badgeState = await setBadgeState(tabId, "hiddenState", "visible");
    addChange(tabId, "badgeText", badgeState.text);
  }
}
