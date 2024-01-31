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

import { info } from "../../info/background";
import { port } from "../../../adblockpluschrome/lib/messaging/port";
import { type MessageSender } from "../../core/api/background";
import { displayValueList, isGetClassNameMessage } from "../shared";
import { className } from "./unload-cleanup.types";

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
 * @param sender An object representing the sender of the message.
 */
async function handleMessage(
  message: unknown,
  sender: MessageSender
): Promise<string | undefined> {
  if (!isGetClassNameMessage(message)) {
    return;
  }

  if (info.application !== "firefox" || typeof sender.page === "undefined") {
    return;
  }

  await browser.tabs.insertCSS(sender.page.id, {
    code: css,
    frameId: sender.frame.id,
    runAt: "document_start"
  });
  return className;
}

/**
 * Starts listening for the message to insert the CSS and send the class name.
 */
export function start(): void {
  port.on("unload-cleanup.getClassName", handleMessage);
  ext.addTrustedMessageTypes(null, ["unload-cleanup.getClassName"]);
}
