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

import "webextension-polyfill";

import { $ } from "../../../js/dom.mjs";
import font300 from "../../../skin/fonts/source-sans-pro-300.woff2?uri";
import font400 from "../../../skin/fonts/source-sans-pro-400.woff2?uri";
import font700 from "../../../skin/fonts/source-sans-pro-700.woff2?uri";
import dialogLogo from "../../../skin/icons/logo/abp-full.svg?uri";
import { type Message } from "../../core/api/shared";
import {
  type PingMessage,
  type ResizeMessage,
  type StartInfo
} from "../shared";
import dialogClose from "./close.svg?uri";
import dialogCss from "./dialog.css?text";
import dialogHtml from "./dialog.html?text";

/**
 * Handles interaction with close button
 *
 * @param event - Button click event
 */
function handleCloseEvent(event: PointerEvent): void {
  if (!event.isTrusted) {
    return;
  }

  void sendMessage({ type: "onpage-dialog.close" });
}

/**
 * Handles interaction with continue button
 *
 * @param event - Button click event
 */
function handleContinueEvent(event: PointerEvent): void {
  if (!event.isTrusted) {
    return;
  }

  void sendMessage({ type: "onpage-dialog.continue" });
}

/**
 * Handles messages from this frame
 *
 * @param event - Message event
 */
async function handleMessageEvent(event: MessageEvent): Promise<void> {
  if (event.data !== "onpage-dialog.start") {
    return;
  }

  // Before we render the dialog, we need to be sure that we're running in a
  // tab for which the dialog is intended to be shown
  const startInfo = await sendMessage({ type: "onpage-dialog.get" });
  if (!isStartInfo(startInfo)) {
    return;
  }

  const resizeObserver = new ResizeObserver((): void => {
    void sendMessage<ResizeMessage>({
      type: "onpage-dialog.resize",
      height: $(":root").offsetHeight
    });
  });
  resizeObserver.observe(document.body);

  const style = document.createElement("style");
  style.textContent = dialogCss;
  document.head.appendChild(style);

  document.body.innerHTML = dialogHtml;

  const { content, localeInfo } = startInfo;

  $(":root").dir = localeInfo.readingDirection;
  $(":root").lang = localeInfo.locale;

  insertAsset("icon-close", dialogClose);
  insertFont(300, font300);
  insertFont(400, font400);
  insertFont(700, font700);

  $("#logo").src = dialogLogo;
  $("#continue").textContent = content.button;
  $("#title").textContent = content.title;

  for (const body of content.body) {
    const paragraph = document.createElement("p");
    paragraph.textContent = body;
    $("#body").appendChild(paragraph);
  }

  $("#close").addEventListener("click", handleCloseEvent);
  $("#continue").addEventListener("click", handleContinueEvent);

  // We're pinging the background page once per minute, so that it is aware
  // for how long the dialog has already been shown, in case it needs to
  // execute some actions with a delay
  let displayDuration = 0;
  setInterval(() => {
    displayDuration += 1;
    void sendMessage<PingMessage>({
      type: "onpage-dialog.ping",
      displayDuration
    });
  }, 60 * 1000);
}

/**
 * Makes given asset available as a CSS custom property
 *
 * @param name - CSS custom property name
 * @param dataUri - Asset data URI
 */
function insertAsset(name: string, dataUri: string): void {
  $(":root").style.setProperty(
    `--abp-overlay-onpage-dialog-url-${name}`,
    `url("${dataUri}")`
  );
}

/**
 * Makes given font available
 *
 * @param weight - Font weight
 * @param dataUri - Font file data URI
 */
function insertFont(weight: number, dataUri: string): void {
  const font = new FontFace("Source Sans Pro", `url("${dataUri}")`, {
    style: "normal",
    weight: weight.toString()
  });
  document.fonts.add(font);
}

/**
 * Check whether given candidate contains initialization information
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate contains initialization information
 */
function isStartInfo(candidate: unknown): candidate is StartInfo {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "content" in candidate &&
    "localeInfo" in candidate
  );
}

/**
 * Sends messages to the background page
 *
 * @param message - Message
 *
 * @returns message response
 */
async function sendMessage<T extends Message>(message: T): Promise<unknown> {
  return await browser.runtime.sendMessage(message);
}

/**
 * Initializes on-page dialog
 */
function start(): void {
  // Only run in anonymous frames directly under top-level frame
  if (
    window.parent !== window.top ||
    window === window.top ||
    window.location.href !== "about:blank"
  ) {
    return;
  }

  window.addEventListener("message", (event: MessageEvent) => {
    void handleMessageEvent(event);
  });
}

start();
