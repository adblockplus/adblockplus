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

import { type Tabs } from "webextension-polyfill";

import { port } from "../../../adblockpluschrome/lib/messaging/port";
import { Prefs } from "../../../adblockpluschrome/lib/prefs";
import {
  type Dialog,
  DialogEventType,
  Timing,
  eventEmitter as dialogEmitter,
  showOnpageDialog
} from "../../onpage-dialog/background";
import { type MessageSender } from "../../core/api/background";
import { type Message } from "../../core/api/shared";
import { detectedMessageType, isEnabled } from "../shared";

/**
 * Dialog ID
 */
const dialogId = "yt-wall-detection";
/**
 * Storage key for determining whether user has interacted with dialog
 */
const dialogInteractedStorageKey = "ytWallDetection_dialog_interacted";

/**
 * Determines whether to stop showing new dialogs after user interaction
 *
 * @param dialog - Dialog information
 */
function handleDialogInteraction(dialog: Dialog): void {
  if (dialog.id !== dialogId) {
    return;
  }

  void Prefs.set(dialogInteractedStorageKey, true);
}

/**
 * Handles wall detected event
 *
 * @param message - Message
 * @param sender - Message sender
 */
function handleDetectedMessage(message: Message, sender: MessageSender): void {
  if (typeof sender.tab !== "object" || typeof sender.tab.id !== "number") {
    return;
  }

  showDialog(sender.tab.id, sender.tab);
}

/**
 * Shows on-page dialog on the given tab
 *
 * @param tabId - ID of tab in which to show the on-page dialog
 * @param tab - Tab information for tab in which to show the on-page dialog
 */
function showDialog(tabId: number, tab: Tabs.Tab): void {
  // Stop showing new dialogs after user interaction
  if (Prefs.get(dialogInteractedStorageKey) === true) {
    return;
  }

  void showOnpageDialog(tabId, tab, {
    behavior: {
      displayDuration: 0,
      target: Prefs.get("ytWallDetection_dialog_url"),
      timing: Timing.immediate
    },
    content: {
      body: [browser.i18n.getMessage("ytWallDetection_dialog_body")],
      button: browser.i18n.getMessage("ytWallDetection_dialog_button"),
      title: browser.i18n.getMessage("ytWallDetection_dialog_title")
    },
    id: dialogId
  });
}

/**
 * Initializes YouTube wall detection feature
 */
function start(): void {
  if (!isEnabled) {
    return;
  }

  dialogEmitter.on(DialogEventType.buttonClicked, handleDialogInteraction);
  dialogEmitter.on(DialogEventType.closed, handleDialogInteraction);

  port.on(detectedMessageType, handleDetectedMessage);

  ext.addTrustedMessageTypes("https://youtube.com", [detectedMessageType]);
  ext.addTrustedMessageTypes("https://www.youtube.com", [detectedMessageType]);
}

start();
