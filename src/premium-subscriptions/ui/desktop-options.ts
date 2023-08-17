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

import { EventEmitter } from "../../../adblockpluschrome/lib/events";
import api, { MessageProps } from "../../core/api/front";
import { $, $$ } from "../../../js/dom.mjs";
import { premiumTypes } from "../shared";

import { isCollectionSubscription } from "../../polyfills/ui";

/**
 * Sets the premium current state to a given list item in the page
 *
 * @param listItem - list item element in the page
 * @param premiumIsActive - whether Premium is active or not
 */
function updateListItem(listItem: HTMLElement, premiumIsActive: boolean): void {
  if (!listItem) {
    return;
  }

  const checkbox = $("button[role='checkbox']", listItem);

  if (!checkbox) {
    return;
  }

  checkbox.toggleAttribute("disabled", !premiumIsActive);

  // adjust the button's on-click action for the opt-in subscriptions
  const { recommended } = listItem.dataset;
  if (recommended === "cookies-premium") {
    const checked = checkbox.getAttribute("aria-checked") === "true";
    if (checked) {
      checkbox.setAttribute("data-action", "toggle-remove-subscription");
      checkbox.removeAttribute("data-dialog");
    } else {
      checkbox.setAttribute("data-action", "open-dialog");
      checkbox.setAttribute("data-dialog", "optIn-premium-subscription");
    }
  }
}

/**
 * Sets the premium current state to all list items in the page
 *
 * @param premiumIsActive - whether Premium is active or not
 */
function updateListItems(premiumIsActive: boolean): void {
  const premiumListItems = $$("#premium-list-table li");

  premiumListItems.forEach((listItem: HTMLElement) => {
    updateListItem(listItem, premiumIsActive);
  });
}

/**
 * Gets the recommended list element item that represents a premium subscription
 *
 * @param recommended - subscription type Id
 *
 * @returns list element item that represents a premium subscription
 * or null if not found
 */
function getRecommendedListItem(recommended: string): HTMLElement | null {
  const listItem = $(
    `#premium-list-table li[data-recommended="${recommended}"]`
  );

  if (!(listItem instanceof HTMLElement)) {
    return null;
  }

  return listItem;
}

/**
 * Handle events that are emitted when a Collection updates an item
 *
 * @param item - item that has been updated
 */
async function onCollectionItemUpdated(item: unknown): Promise<void> {
  if (!isCollectionSubscription(item)) {
    return;
  }

  if (premiumTypes.has(item.recommended)) {
    const listItem = getRecommendedListItem(item.recommended);

    if (!listItem) {
      return;
    }

    const { isActive: premiumIsActive } = await api.premium.get();
    updateListItem(listItem, premiumIsActive);

    if (item.recommended === "cookies-premium") {
      listItem.classList.add("new");
    }
  }
}

/**
 * Callback for messages received from browser.runtime
 *
 * @param message message - message received from browser.runtime
 */
function onApiMessage(message?: MessageProps): void {
  if (!message) {
    return;
  }

  switch (message.type) {
    case "premium.respond": {
      const premiumIsActive = message.args[0].isActive;
      updateListItems(premiumIsActive);
      break;
    }
  }
}

/**
 * Initializes premium-subscriptions in the options page
 */
export async function start(optionsPageEmitter: EventEmitter): Promise<void> {
  const { isActive: premiumIsActive } = await api.premium.get();
  updateListItems(premiumIsActive);

  optionsPageEmitter.on("collectionItem.updated", onCollectionItemUpdated);

  api.addListener(onApiMessage);
}
