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
import { ExtensionPanelWithSearch } from "./devtools.types";

/**
 * Developer tools panel window
 **/
let panelWindow: Window | null = null;

/**
 * Forward search actions to panel window
 *
 * @param eventName - Search action
 * @param queryString - Search query
 **/
function forwardSearchAction(eventName: string, queryString?: string): void {
  if (!panelWindow) {
    return;
  }

  panelWindow.postMessage({ type: eventName, queryString }, "*");
}

/**
 * Sets panel window
 *
 * @param window - Developer tools panel window
 **/
function setPanelWindow(window: Window): void {
  panelWindow = window;
}

/**
 * Unsets panel window
 **/
function unsetPanelWindow(): void {
  panelWindow = null;
}

/**
 * Initializes developer tools
 */
async function start() {
  const isEnabled = await api.prefs.get("show_devtools_panel");
  if (!isEnabled) {
    return;
  }

  // @types/webextension-polyfill doesn't know about ExtensionPanel.onSearch,
  // so we need to clarify that by using our own type
  const panel: ExtensionPanelWithSearch = await browser.devtools.panels.create(
    "Adblock Plus",
    "icons/abp-32.png",
    "devtools-panel.html"
  );

  panel.onShown.addListener(setPanelWindow);
  panel.onHidden.addListener(unsetPanelWindow);

  if (panel.onSearch) {
    panel.onSearch.addListener(forwardSearchAction);
  }
}

void start().catch(console.error);
