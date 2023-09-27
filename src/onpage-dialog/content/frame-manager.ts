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

import * as api from "../../core/api/front";
import { Message, isMessage } from "../../polyfills/shared";
import { prepareElementForUnload } from "../../unload-cleanup/content";
import { DisplayValue } from "../../unload-cleanup/shared";
import { ResizeMessage, ShowMessage } from "../shared";

/**
 * On-page dialog frame
 */
let iframe: HTMLIFrameElement | null = null;
/**
 * On-page dialog overlay
 */
let overlay: HTMLElement | null = null;

/**
 * Handles messages from background page
 *
 * @param message - Message
 */
function handleMessage(message: unknown): void {
  if (!isMessage(message)) {
    return;
  }

  switch (message.type) {
    case "onpage-dialog.hide":
      hideDialog();
      break;
    case "onpage-dialog.resize":
      if (!iframe) {
        break;
      }

      if (!isResizeMessage(message)) {
        break;
      }

      iframe.style.setProperty(
        "--abp-overlay-onpage-dialog-height",
        `${message.height}px`
      );
      break;
    case "onpage-dialog.show":
      if (!isShowMessage(message)) {
        break;
      }

      showDialog(message.platform);
      break;
    default:
  }
}

/**
 * Removes frame to hide on-page dialog, if it is shown
 */
function hideDialog(): void {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
  iframe = null;
  overlay = null;
}

/**
 * Checks whether given message is "onpage-dialog.resize"
 *
 * @param message - Message
 *
 * @returns whether given message is "onpage-dialog.resize"
 */
function isResizeMessage(message: Message): message is ResizeMessage {
  return message.type === "onpage-dialog.resize" && "height" in message;
}

/**
 * Checks whether given message is "onpage-dialog.show"
 *
 * @param message - Message
 *
 * @returns whether given message is "onpage-dialog.show"
 */
function isShowMessage(message: Message): message is ShowMessage {
  return message.type === "onpage-dialog.show" && "platform" in message;
}

/**
 * Creates frame to show on-page dialog
 */
function showDialog(platform: string): void {
  overlay = document.createElement("div");
  overlay.setAttribute("id", "__abp-overlay-onpage-dialog");

  iframe = document.createElement("iframe");

  iframe.setAttribute("frameborder", "0");
  // Firefox doesn't inject content scripts into frames with the sandbox
  // attribute, so we need to set the attribute after adding the element
  // to the DOM
  if (platform !== "gecko") {
    iframe.setAttribute("sandbox", "");
  }

  iframe.addEventListener("load", (): void => {
    if (!iframe?.contentWindow) {
      return;
    }

    // The content script for the on-page dialog is already injected into
    // all frames, so we just need to tell it that it's running in a frame,
    // where it can render the on-page dialog
    iframe.contentWindow.postMessage("onpage-dialog.start", "*");
  });

  overlay.appendChild(iframe);
  document.body.appendChild(overlay);
  void prepareElementForUnload(overlay, DisplayValue.block);

  // Firefox doesn't inject content scripts into frames with the sandbox
  // attribute, so we need to set the attribute after adding the element
  // to the DOM
  if (platform === "gecko") {
    iframe.setAttribute("sandbox", "");
  }
}

/**
 * Initializes on-page frame manager
 */
function start(): void {
  browser.runtime.onMessage.addListener(handleMessage);

  // Clean up after extension unloads
  api.addDisconnectListener((): void => {
    stop();
  });
}

/**
 * Uninitializes on-page frame manager
 */
function stop(): void {
  browser.runtime.onMessage.removeListener(handleMessage);
  hideDialog();
}

start();
