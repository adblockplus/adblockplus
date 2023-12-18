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

import {
  type DetectedMessage,
  detectedMessageType,
  isEnabled
} from "../shared";

/**
 * Mutation observer to detect when a matching element gets added to the DOM
 */
const observer = new MutationObserver(handleMutations);
/**
 * CSS selector identifying YouTube ad wall element
 */
const selector = "ytd-enforcement-message-view-model";

/**
 * Handles DOM modifications to check whether a matching element got added
 * to the DOM
 *
 * @param mutations - DOM modifications
 */
function handleMutations(mutations: MutationRecord[]): void {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!isElement(node)) {
        continue;
      }

      if (!node.matches(selector)) {
        continue;
      }

      const message: DetectedMessage = { type: detectedMessageType };
      void browser.runtime.sendMessage(message);

      // No need to continue checking after we encountered a matching element
      observer.disconnect();
      return;
    }
  }
}

/**
 * Checks whether given candidate is a DOM element
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate is a DOM element
 */
function isElement(candidate: unknown): candidate is Element {
  return candidate instanceof Element;
}

/**
 * Initializes YouTube ad wall detection feature
 */
function start(): void {
  if (!isEnabled) {
    return;
  }

  observer.observe(document, {
    attributes: false,
    childList: true,
    characterData: false,
    subtree: true
  });
}

start();
