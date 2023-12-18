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

import * as ewe from "@eyeo/webext-sdk";

import { type Tabs } from "webextension-polyfill";

import { port } from "../../../adblockpluschrome/lib/messaging/port";
import { TabSessionStorage } from "../../../adblockpluschrome/lib/storage/tab-session";
import { EventEmitter } from "../../../adblockpluschrome/lib/events";
import { getLocaleInfo } from "../../i18n/background";
import { info } from "../../info/background";
import {
  CommandName,
  createSafeOriginUrl,
  dismissCommand,
  doesLicenseStateMatch,
  getBehavior,
  getContent,
  recordEvent
} from "../../ipm/background";
import * as logger from "../../logger/background";
import {
  type MessageSender,
  type TabRemovedEventData
} from "../../polyfills/background";
import { type Message, isMessage } from "../../polyfills/shared";
import { type HideMessage, type PingMessage, type StartInfo } from "../shared";
import { isDialog, isDialogBehavior, isDialogContent } from "./dialog";
import { type Dialog } from "./dialog.types";
import { setDialogCommandHandler } from "./middleware";
import { clearStats, getStats, setStats } from "./stats";
import { DialogEventType, ShowOnpageDialogResult } from "./tab-manager.types";
import {
  shouldBeDismissed,
  shouldBeShown,
  start as setupTimings
} from "./timing";

/**
 * Tab-specific session storage for dialogs
 */
const assignedDialogs = new TabSessionStorage("onpage-dialog:dialogs");
/**
 * Dialog event emitter
 */
export const eventEmitter = new EventEmitter();
/**
 * Queue of dialogs that haven't been assigned to a tab yet
 */
const unassignedDialogs = new Set<Dialog>();

/**
 * Removes on-page dialog
 *
 * @param tabId - Tab ID
 */
async function removeDialog(tabId: number): Promise<void> {
  logger.debug("[onpage-dialog]: Remove dialog");

  const dialog = await assignedDialogs.get(tabId);
  if (!isDialog(dialog)) {
    return;
  }

  try {
    const message: HideMessage = { type: "onpage-dialog.hide" };
    await sendMessage(tabId, message);
    await assignedDialogs.delete(tabId);
  } catch (ex) {
    // Ignore if tab has already been removed
  }

  // Determine whether dialog should remain active
  const stats = getStats(dialog.id);
  if (!shouldBeDismissed(dialog, stats)) {
    logger.debug("[onpage-dialog]: Keep dialog active");
    return;
  }

  dismissDialog(dialog);
  clearStats(dialog.id);
}

/**
 * Dismisses on-page dialog
 *
 * @param dialog - Dialog information
 */
function dismissDialog(dialog: Dialog): void {
  logger.debug("[onpage-dialog]: Dismiss dialog");
  unassignedDialogs.delete(dialog);

  if (typeof dialog.ipmId === "string") {
    dismissCommand(dialog.ipmId);
  }
}

/**
 * Forwards message from a tab to its top-level frame
 *
 * @param message - Message
 * @param sender - Message sender
 *
 * @returns message response
 */
async function forwardMessage(
  message: unknown,
  sender: MessageSender
): Promise<unknown> {
  if (!isMessage(message)) {
    return;
  }

  return await sendMessage(sender.page.id, message);
}

/**
 * Handles "onpage-dialog.close" messages
 *
 * @param message - Message
 * @param sender - Message sender
 */
async function handleCloseMessage(
  message: Message,
  sender: MessageSender
): Promise<void> {
  const dialog = await assignedDialogs.get(sender.page.id);
  if (!isDialog(dialog)) {
    return;
  }

  void removeDialog(sender.page.id);
  recordDialogEvent(dialog, DialogEventType.closed);
}

/**
 * Handles "onpage-dialog.continue" messages
 *
 * @param message - Message
 * @param sender - Message sender
 */
async function handleContinueMessage(
  message: Message,
  sender: MessageSender
): Promise<void> {
  const dialog = await assignedDialogs.get(sender.page.id);
  if (!isDialog(dialog)) {
    return;
  }

  const safeTargetUrl = createSafeOriginUrl(dialog.behavior.target);
  if (safeTargetUrl === null) {
    return;
  }

  void browser.tabs.create({ url: safeTargetUrl });

  void removeDialog(sender.page.id);
  recordDialogEvent(dialog, DialogEventType.buttonClicked);
}

/**
 * Handles IPM commands
 *
 * @param ipmId - IPM ID
 */
function handleDialogCommand(ipmId: string): void {
  if (typeof ipmId !== "string") {
    return;
  }

  const behavior = getBehavior(ipmId);
  if (!isDialogBehavior(behavior)) {
    return;
  }

  const content = getContent(ipmId);
  if (!isDialogContent(content)) {
    return;
  }

  const dialog: Dialog = { behavior, content, id: ipmId, ipmId };
  unassignedDialogs.add(dialog);
}

/**
 * Handles "onpage-dialog.get" messages
 *
 * @param message - Message
 * @param sender - Message sender
 *
 * @returns on-page dialog initialization information
 */
async function handleGetMessage(
  message: Message,
  sender: MessageSender
): Promise<StartInfo | null> {
  const dialog = await assignedDialogs.get(sender.page.id);
  if (!isDialog(dialog)) {
    return null;
  }

  return {
    content: dialog.content,
    localeInfo: getLocaleInfo()
  };
}

/**
 * Handles "onpage-dialog.ping" messages
 *
 * @param message - Message
 * @param  sender - Message sender
 */
async function handlePingMessage(
  message: PingMessage,
  sender: MessageSender
): Promise<void> {
  const dialog = await assignedDialogs.get(sender.page.id);
  if (!isDialog(dialog)) {
    return;
  }

  // Check whether on-page dialog has been shown long enough already
  if (
    dialog.behavior.displayDuration === 0 ||
    message.displayDuration < dialog.behavior.displayDuration
  ) {
    return;
  }

  void removeDialog(sender.page.id);
  recordDialogEvent(dialog, DialogEventType.ignored);
}

/**
 * Handles "tab-removed" tab session storage event
 *
 * @param data - Event data
 */
function handleTabRemovedEvent(data: TabRemovedEventData): void {
  const { tabId, value: dialog } = data;

  if (!isDialog(dialog)) {
    return;
  }

  void removeDialog(tabId);
  recordDialogEvent(dialog, DialogEventType.ignored);
}

/**
 * Handles browser.tabs.onUpdated events
 *
 * @param tabId - Tab ID
 * @param changeInfo - Tab change information
 * @param tab - Tab
 */
async function handleTabsUpdatedEvent(
  tabId: number,
  changeInfo: Tabs.OnUpdatedChangeInfoType,
  tab: Tabs.Tab
): Promise<void> {
  if (unassignedDialogs.size === 0) {
    logger.debug("[onpage-dialog]: No command");
    return;
  }

  if (
    changeInfo.status !== "complete" ||
    tab.incognito ||
    typeof tab.url !== "string" ||
    !/^https?:/.test(tab.url)
  ) {
    return;
  }

  for (const dialog of unassignedDialogs) {
    // Ignore and dismiss command if license state doesn't match those in the
    // command
    if (!(await doesLicenseStateMatch(dialog.behavior))) {
      logger.debug("[onpage-dialog]: License has mismatch");
      dismissDialog(dialog);
      continue;
    }

    const result = await showOnpageDialog(tabId, tab, dialog);
    if (result === ShowOnpageDialogResult.rejected) {
      dismissDialog(dialog);
    }
  }
}

/**
 * Records dialog event
 *
 * @param dialog - Dialog information
 * @param eventType - Dialog event type
 */
function recordDialogEvent(dialog: Dialog, eventType: DialogEventType): void {
  eventEmitter.emit(eventType, dialog);

  if (typeof dialog.ipmId === "string") {
    void recordEvent(dialog.ipmId, CommandName.createOnPageDialog, eventType);
  }
}

/**
 * Sends message to the given tab
 *
 * @param tabId - Tab ID
 * @param message - Message
 *
 * @returns message response
 */
async function sendMessage(tabId: number, message: Message): Promise<unknown> {
  return await browser.tabs.sendMessage(tabId, message, { frameId: 0 });
}

/**
 * Indicates whether user wants to ignore dialogs
 *
 * @returns whether dialogs should be ignored
 */
async function shouldBeIgnored(): Promise<boolean> {
  const ignoredCategories = await ewe.notifications.getIgnoredCategories();
  return ignoredCategories.includes("*");
}

/**
 * Show dialog on given tab
 *
 * @param tabId - ID of tab in which to show the dialog
 * @param tab - Tab in which to show the dialog
 * @param dialog - Dialog information
 *
 * @returns result of attempting to show on-page dialog
 */
export async function showOnpageDialog(
  tabId: number,
  tab: Tabs.Tab,
  dialog: Dialog
): Promise<ShowOnpageDialogResult> {
  // Ignore and dismiss dialog if user opted-out of notifications
  if (await shouldBeIgnored()) {
    logger.debug("[onpage-dialog]: User ignores notifications");
    return ShowOnpageDialogResult.rejected;
  }

  // Ignore and dismiss dialog if the given tab already contains a dialog
  if (await assignedDialogs.has(tabId)) {
    logger.debug("[onpage-dialog]: Tab already contains dialog");
    return ShowOnpageDialogResult.rejected;
  }

  const stats = getStats(dialog.id);

  // Ignore if on-page dialog should not be shown for this tab
  if (!(await shouldBeShown(tab, dialog, stats))) {
    logger.debug("[onpage-dialog]: Don't show");
    return ShowOnpageDialogResult.ignored;
  }

  logger.debug("[onpage-dialog]: Show dialog");
  await assignedDialogs.set(tabId, dialog);

  setStats(dialog.id, {
    displayCount: stats.displayCount + 1,
    lastDisplayTime: Date.now()
  });

  await addDialog(tabId);

  recordDialogEvent(dialog, DialogEventType.injected);

  return ShowOnpageDialogResult.shown;
}

/**
 * Injects the necessary user styles into the tab and tells the tab
 * to display the on-page dialog
 *
 * @param tabId - ID of tab in which to show the dialog
 */
async function addDialog(tabId: number): Promise<void> {
  // We only inject styles into the page when we actually need them. Otherwise
  // websites may use them to detect the presence of the extension. For content
  // scripts this is not a problem, because those only interact with the web
  // page when we tell them to. Therefore we inject them via manifest.json.
  if (browser.scripting) {
    await browser.scripting.insertCSS({
      files: ["skin/onpage-dialog.css"],
      origin: "USER",
      target: { tabId }
    });
  } else {
    await browser.tabs.insertCSS(tabId, {
      cssOrigin: "user",
      file: "/skin/onpage-dialog.css"
    });
  }

  await browser.tabs.sendMessage(tabId, {
    type: "onpage-dialog.show",
    platform: info.platform
  });
}

/**
 * Initializes on-page manager
 */
async function start(): Promise<void> {
  await setupTimings();

  // Handle messages from content scripts
  port.on("onpage-dialog.close", handleCloseMessage);
  port.on("onpage-dialog.continue", handleContinueMessage);
  port.on("onpage-dialog.get", handleGetMessage);
  port.on("onpage-dialog.ping", handlePingMessage);
  port.on("onpage-dialog.resize", forwardMessage);

  ext.addTrustedMessageTypes(null, [
    "onpage-dialog.continue",
    "onpage-dialog.close",
    "onpage-dialog.get",
    "onpage-dialog.ping",
    "onpage-dialog.resize"
  ]);

  // Dismiss dialog when tab used for storing session data gets closed,
  // reloaded or unloaded
  assignedDialogs.on("tab-removed", handleTabRemovedEvent);

  // Handle commands
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  browser.tabs.onUpdated.addListener(handleTabsUpdatedEvent);
  setDialogCommandHandler(handleDialogCommand);
}

void start().catch(logger.error);
