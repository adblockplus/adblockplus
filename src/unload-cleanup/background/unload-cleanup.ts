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

import * as info from "info";
import { className } from "./unload-cleanup.types";
import { displayValueList, messageName } from "../shared";

/**
 * The CSS code to insert for visually hiding elements after extension unload.
 *
 * Will contain class names for each known display value with their
 * respective value set as `!important`, so that the content script can set
 * the element's display to `none`. When the inserted CSS goes away, the
 * `none` value will win and the element will be taken out of the render tree.
 */
const css = displayValueList
  .map(
    (displayValue) =>
      `.${className}--${displayValue} {display: ${displayValue} !important;}`
  )
  .join("\n");

/**
 * Inserts the unload CSS and sends back the unload class name. Will only do
 * this if we are on Firefox.
 *
 * @param message The message itself. This is a serializable object.
 * @param sender A runtime.MessageSender object representing the sender of
 *  the message.
 */
function handleMessage(
  message: unknown,
  sender: browser.Runtime.MessageSender
): Promise<string> | undefined {
  if (message !== messageName) {
    return;
  }

  if (info.application !== "firefox" || typeof sender.tab === "undefined") {
    return;
  }

  return browser.tabs
    .insertCSS(sender.tab.id, {
      code: css,
      frameId: sender.frameId,
      runAt: "document_start"
    })
    .then(() => className);
}

/**
 * Starts listening for the message to insert the CSS and send the class name.
 */
export function start(): void {
  browser.runtime.onMessage.addListener(handleMessage);
}
