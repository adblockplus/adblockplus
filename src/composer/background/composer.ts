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

// Modules from legacy directories don't have type information yet, and adding
// it is not trivial. Therefore we're first moving them over and apply the
// coding style, and we're going to add type information in a subsequent step.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import * as ewe from "@eyeo/webext-sdk";

import { port } from "../../../adblockpluschrome/lib/messaging/port.js";
import { SessionStorage } from "../../../adblockpluschrome/lib/storage/session.js";
import { TabSessionStorage } from "../../../adblockpluschrome/lib/storage/tab-session.js";
import { allowlistingState } from "../../../adblockpluschrome/lib/allowlisting.js";
import { Prefs } from "../../../adblockpluschrome/lib/prefs.js";
import { extractHostFromFrame } from "../../core/url/shared";
import { info } from "../../info/background";

/**
 * Key to store/retrieve the active filter composer dialog
 */
const activeDialogKey = "activeDialog";

const session = new SessionStorage("filterComposer");

const readyActivePages = new TabSessionStorage(
  "filterComposer:readyActivePages"
);
let showingContextMenu = false;

function isValidString(s): boolean {
  return s && s.indexOf("\0") === -1;
}

function escapeChar(chr): string {
  const code = chr.charCodeAt(0);

  // Control characters and leading digits must be escaped based on
  // their char code in CSS. Moreover, curly brackets aren't allowed
  // in elemhide filters, and therefore must be escaped based on their
  // char code as well.
  if (code <= 0x1f || code === 0x7f || /[\d{}]/.test(chr)) {
    return "\\" + code.toString(16) + " ";
  }

  return "\\" + chr;
}

/**
 * Escapes a token (e.g. tag, id, class or attribute) to be used in
 * CSS selectors.
 *
 * @param {string} s
 * @return {string}
 * @static
 */
export function escapeCSS(s): string {
  return s.replace(/^[\d-]|[^\w\-\u0080-\uFFFF]/g, escapeChar);
}

/**
 * Quotes a string to be used as attribute value in CSS selectors.
 *
 * @param {string} value
 * @return {string}
 * @static
 */
export function quoteCSS(value): string {
  /* eslint-disable-next-line no-control-regex */
  return '"' + value.replace(/["\\{}\x00-\x1F\x7F]/g, escapeChar) + '"';
}

async function composeFilters(
  details
): Promise<{ filters: any[]; selectors: any[] }> {
  const { page, frame } = details;
  const filters = [];
  const selectors = [];

  const isFrameAllowlisted = await ewe.filters.isResourceAllowlisted(
    frame.url,
    "document",
    page.id,
    frame.id
  );
  if (!isFrameAllowlisted) {
    const docDomain = extractHostFromFrame(frame);

    // Add a blocking filter for each URL of the element that can be blocked
    if (details.url) {
      let type;
      switch (details.tagName) {
        case "img":
        case "input":
          type = "image";
          break;
        case "audio":
        case "video":
          type = "media";
          break;
        case "frame":
        case "iframe":
          type = "subdocument";
          break;
        case "object":
        case "embed":
          type = "object";
          break;
      }

      const isAllowlisted = await ewe.filters.isResourceAllowlisted(
        details.url,
        type,
        page.id,
        frame.id
      );
      if (!isAllowlisted) {
        let filterText = details.url.replace(/^[\w-]+:\/+(?:www\.)?/, "||");
        const isSpecificAllowlisted = await ewe.filters.isResourceAllowlisted(
          details.url,
          "genericblock",
          page.id,
          frame.id
        );
        if (isSpecificAllowlisted) {
          filterText += "$domain=" + docDomain;
        }

        if (!filters.includes(filterText)) {
          filters.push(filterText);
        }
      }
    }

    // If we couldn't generate any blocking filters, fallback to element hiding
    const elementAllowlistingFilters = await ewe.filters.getAllowingFilters(
      page.id,
      {
        frameId: frame.id,
        types: ["elemhide"]
      }
    );
    const isElementAllowlisted = !!elementAllowlistingFilters.length;
    if (filters.length === 0 && !isElementAllowlisted) {
      // Generate CSS selectors based on the element's "id" and
      // "class" attribute.
      if (isValidString(details.id)) {
        selectors.push("#" + escapeCSS(details.id));
      }

      const classes = details.classes.filter(isValidString);
      if (classes.length > 0) {
        selectors.push(classes.map((c) => "." + escapeCSS(c)).join(""));
      }

      // If there is a "src" attribute, specifiying a URL that we can't block,
      // generate a CSS selector matching the "src" attribute
      if (isValidString(details.src)) {
        selectors.push(
          escapeCSS(details.tagName) + "[src=" + quoteCSS(details.src) + "]"
        );
      }

      // As last resort, if there is a "style" attribute, and we
      // couldn't generate any filters so far, generate a CSS selector
      // matching the "style" attribute
      if (
        isValidString(details.style) &&
        selectors.length === 0 &&
        filters.length === 0
      ) {
        selectors.push(
          escapeCSS(details.tagName) + "[style=" + quoteCSS(details.style) + "]"
        );
      }

      // Add an element hiding filter for each generated CSS selector
      for (const selector of selectors) {
        filters.push(docDomain.replace(/^www\./, "") + "##" + selector);
      }
    }
  }

  return { filters, selectors };
}

/**
 * Opens the "block element" dialog.
 *
 * @event "composer.openDialog"
 * @property {string[]} filters - The suggested filters to populate the dialog
 *                                with.
 * @returns {?number} dialog window's page ID
 */
async function handleOpenDialogMessage(message, sender): Promise<void> {
  // Close previously active dialog before opening new one
  const activeDialog = await session.get(activeDialogKey);
  if (activeDialog) {
    void browser.tabs.remove(activeDialog.tab.id);

    // We cannot wait until this cleanup to occur when the tab gets closed,
    // since the active dialog may have already changed in the meantime
    void browser.tabs.sendMessage(activeDialog.sender.id, {
      type: "composer.content.dialogClosed",
      popupId: activeDialog.tab.id
    });
  }

  const dialogWindow = await browser.windows.create({
    url: browser.runtime.getURL("composer.html"),
    left: 50,
    top: 50,
    width: 600,
    height: 300,
    type: "popup"
  });
  const [dialogTab] = dialogWindow.tabs;

  await session.set(activeDialogKey, {
    filters: message.filters,
    highlights: message.highlights,
    initAttempt: 0,
    sender: {
      id: sender.page.id
    },
    status: null,
    tab: {
      id: dialogTab.id,
      status: dialogTab.status
    },
    window: {
      id: dialogWindow.id,
      width: dialogWindow.width
    }
  });

  // Wait for the tab to finish loading
  if (dialogTab.status !== "complete") {
    return;
  }

  await doInit();
}

async function doInit(): Promise<void> {
  const activeDialog = await session.get(activeDialogKey);

  await browser.tabs.sendMessage(activeDialog.sender.id, {
    type: "composer.content.dialogOpened",
    popupId: activeDialog.tab.id
  });

  activeDialog.initAttempt += 1;
  await session.set(activeDialogKey, activeDialog);
  if (activeDialog.initAttempt > 30) {
    return;
  }

  try {
    const response = await browser.tabs.sendMessage(activeDialog.tab.id, {
      type: "composer.dialog.init",
      sender: activeDialog.sender.id,
      filters: activeDialog.filters,
      highlights: activeDialog.highlights
    });

    // Sometimes sendMessage incorrectly reports a success on Firefox, so
    // we must check the response too.
    if (!response) {
      throw new Error();
    }

    // Sometimes Firefox <63 doesn't draw the window's contents[1]
    // initially, so we resize the window slightly as a workaround.
    // [1] - https://bugzilla.mozilla.org/show_bug.cgi?id=1408446
    if (info.application === "firefox") {
      await browser.windows.update(activeDialog.window.id, {
        width: activeDialog.window.width + 2
      });
    }
  } catch (e) {
    // Firefox sometimes sets the status for a window to "complete" before
    // it is ready to receive messages[1]. As a workaround we'll try again a
    // few times with a second delay.
    // [1] - https://bugzilla.mozilla.org/show_bug.cgi?id=1418655
    setTimeout(() => {
      void doInit();
    }, 100);
  }
}

async function onTabRemoved(removedTabId): Promise<void> {
  const activeDialog = await session.get(activeDialogKey);
  if (!activeDialog) {
    return;
  }

  if (removedTabId === activeDialog.tab.id) {
    // Notify content script if dialog was closed
    void browser.tabs.sendMessage(activeDialog.sender.id, {
      type: "composer.content.dialogClosed",
      popupId: activeDialog.tab.id
    });
  } else if (removedTabId === activeDialog.sender.id) {
    // Close dialog if tab was closed
    void browser.tabs.sendMessage(activeDialog.tab.id, {
      type: "composer.dialog.close"
    });
  } else {
    return;
  }

  await session.delete(activeDialogKey);
}

async function onTabUpdated(tabId, changeInfo): Promise<void> {
  const activeDialog = await session.get(activeDialogKey);
  if (!activeDialog || tabId !== activeDialog.tab.id) {
    return;
  }

  if (activeDialog.status === "complete" || changeInfo.status !== "complete") {
    return;
  }

  activeDialog.status = changeInfo.status;
  await session.set(activeDialogKey, activeDialog);

  await doInit();
}

/**
 * @typedef {object} composerGetFiltersResult
 * @property {string[]} filters
 *   Array of blocking filters which should block the element.
 * @property {string[]} selectors
 *   Array of CSS selectors which should hide the element, a fallback if
 *   blocking wasn't possible.
 */

/**
 * Given the details of an element, return suggested filters or CSS selectors
 * to block or hide that element.
 *
 * @event "composer.getFilters"
 * @property {string} tagName - The element's tag name e.g. "a".
 * @property {string} id - The element's id attribute.
 * @property {string} [src] - The element's src attribute.
 * @property {string} [style] - The element's style attribute.
 * @property {string[]} classes - The element's class list.
 * @property {string?} url - The URL associated with the element.
 * @returns {composerGetFiltersResult}
 */
async function handleGetFiltersMessage(
  message,
  sender
): Promise<{ filters: any[]; selectors: any[] }> {
  return await composeFilters({
    tagName: message.tagName,
    id: message.id,
    src: message.src,
    style: message.style,
    classes: message.classes,
    url: message.url,
    page: sender.page,
    frame: sender.frame
  });
}

/**
 * Forwards the given message payload to the given page ID, allowing a content
 * script to send a message to another page's content script.
 *
 * @event "composer.forward"
 * @property {number} targetPageId The ID of the page to forward the message.
 * @property {object} payload The contents of the message to forward.
 * @returns The response from the forwarded message's recipient.
 */
function handleForwardMessage(msg, sender): Promise<any> | undefined {
  let targetPage;
  if (msg.targetPageId) {
    targetPage = ext.getPage(msg.targetPageId);
  } else {
    targetPage = sender.page;
  }
  if (targetPage) {
    msg.payload.sender = sender.page.id;
    return browser.tabs.sendMessage(targetPage.id, msg.payload);
  }
}

/**
 * Reset "block element" feature
 *
 * @param {ext.Page} page - Page for which to reset "block element" feature
 */
function reset(page): void {
  // When tabs start loading we send them a message to ensure that the state
  // of the "block element" tool is reset. This is necessary since Firefox will
  // sometimes cache the state of a tab when the user navigates back / forward,
  // which includes the state of the "block element" tool.
  // Since sending this message will often fail (e.g. for new tabs which have
  // just been opened) we catch and ignore any exception thrown.
  void browser.tabs
    .sendMessage(page.id, { type: "composer.content.finished" })
    .catch(() => {});
}

/**
 * Handles clicks on context menu items
 *
 * @param {object} itemInfo - Clicked context menu item
 * @param {Tab} tab - Tab on which context menu item was clicked
 */
function handleContextMenuClicked(itemInfo, tab): void {
  if (itemInfo.menuItemId === "block_element") {
    void browser.tabs.sendMessage(tab.id, {
      type: "composer.content.contextMenuClicked"
    });
  }
}

async function showOrHideContextMenu(activePage): Promise<void> {
  // Firefox for Android does not support browser.contextMenus.
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1269062
  if (!("contextMenus" in browser)) {
    return;
  }

  const shouldShowContextMenu =
    Prefs.shouldShowBlockElementMenu &&
    (await readyActivePages.get(activePage.id));

  if (shouldShowContextMenu && !showingContextMenu) {
    void browser.contextMenus.create({
      id: "block_element",
      title: browser.i18n.getMessage("block_element"),
      contexts: ["image", "video", "audio"]
    });
    showingContextMenu = true;
  } else if (!shouldShowContextMenu && showingContextMenu) {
    void browser.contextMenus.remove("block_element");
    showingContextMenu = false;
  }
}

async function updateContextMenu(updatedPage): Promise<void> {
  const tabs = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true
  });
  if (tabs.length > 0 && (!updatedPage || updatedPage.id === tabs[0].id))
    await showOrHideContextMenu(updatedPage || new ext.Page(tabs[0]));
}

/**
 * Handles window focus changes
 *
 * @param {number} windowId - Focused window ID
 */
function handleFocusChanged(windowId): void {
  if (windowId !== browser.windows.WINDOW_ID_NONE) {
    void updateContextMenu();
  }
}

/**
 * Handles allowlisting state changes
 * @param {ext.Page} page - Page whose allowlisting state changed
 * @param {boolean} isAllowlisted - New allowlisting state
 */
function handleAllowlistingStateChanged(page, isAllowlisted): void {
  void readyActivePages.transaction(async () => {
    if (await readyActivePages.has(page.id)) {
      await readyActivePages.set(page.id, !isAllowlisted);
      void updateContextMenu(page);
    }
  });
}

/**
 * Returns true if the given page is ready for the "block element" tool, false
 * otherwise.
 *
 * @event "composer.isPageReady"
 * @property {number} pageId
 * @returns {boolean}
 */
async function handleIsPageReadyMessage(message): Promise<boolean> {
  return await readyActivePages.has(message.pageId);
}

async function initializeReadyState(page): Promise<void> {
  const isAllowlisted = await ewe.filters.isResourceAllowlisted(
    page.url,
    "document",
    page.id
  );
  await readyActivePages.set(page.id, !isAllowlisted);
  void updateContextMenu(page);
}

/**
 * Marks the page which sent this message as being ready for the
 * "block element" tool, but only if the page isn't allowlisted.
 *
 * @event "composer.ready"
 * @returns {boolean}
 */
async function handleReadyMessage(message, sender): Promise<void> {
  await initializeReadyState(sender.page);
}

/**
 * Handles pages that finished loading
 * @param {ext.Page} page - Page that finished loading
 */
async function handlePageLoaded(page): Promise<void> {
  try {
    const state = await browser.tabs.sendMessage(page.id, {
      type: "composer.content.getState"
    });
    if (!state) {
      return;
    }

    await initializeReadyState(page);
  } catch (ex) {
    // Ignore if we're unable to send messages to the tab
  }
}

/**
 * Initializes filter composer backend
 */
function start(): void {
  /* eslint-disable @typescript-eslint/no-misused-promises */
  browser.tabs.onRemoved.addListener(onTabRemoved);
  browser.tabs.onUpdated.addListener(onTabUpdated);
  /* eslint-enable @typescript-eslint/no-misused-promises */

  port.on("composer.forward", handleForwardMessage);
  port.on("composer.getFilters", handleGetFiltersMessage);
  port.on("composer.isPageReady", handleIsPageReadyMessage);
  port.on("composer.openDialog", handleOpenDialogMessage);
  port.on("composer.ready", handleReadyMessage);

  ext.pages.onLoading.addListener(reset);

  if ("contextMenus" in browser) {
    browser.contextMenus.onClicked.addListener(handleContextMenuClicked);
  }

  browser.tabs.onActivated.addListener((activeInfo) => {
    void showOrHideContextMenu(new ext.Page({ id: activeInfo.tabId }));
  });

  // Firefox for Android does not support browser.windows.
  // https://issues.adblockplus.org/ticket/5347
  if ("windows" in browser) {
    browser.windows.onFocusChanged.addListener(handleFocusChanged);
  }

  allowlistingState.addListener("changed", handleAllowlistingStateChanged);

  Prefs.on("shouldShowBlockElementMenu", updateContextMenu);

  // We need to make sure that we check whether the content script is active
  // for each page load, since we only receive the "composer.ready" message
  // when it initializes itself on real page loads
  // https://gitlab.com/adblockinc/ext/adblockplus/adblockplusui/-/issues/1303
  ext.pages.onLoaded.addListener(handlePageLoaded);

  ext.addTrustedMessageTypes(null, [
    "composer.content.clearPreviousRightClickEvent",
    "composer.content.finished",
    "composer.dialog.close",
    "composer.forward",
    "composer.getFilters",
    "composer.openDialog",
    "composer.ready"
  ]);
}

start();
