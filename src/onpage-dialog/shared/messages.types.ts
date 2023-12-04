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

import { type LocaleInfo } from "../../i18n/background";
import { type Message } from "../../polyfills/shared";
import { type DialogContent } from "../background/middleware";

/**
 * Message for hiding the on-page dialog
 */
export interface HideMessage extends Message {
  type: "onpage-dialog.hide";
}

/**
 * Message for pinging the background page while the on-page dialog is shown
 */
export interface PingMessage extends Message {
  type: "onpage-dialog.ping";
  /**
   * Number of minutes indicating how long the on-page dialog
   * has already been shown
   */
  displayDuration: number;
}

/**
 * Message for resizing the on-page dialog frame
 */
export interface ResizeMessage extends Message {
  type: "onpage-dialog.resize";
  /**
   * Frame height in pixel
   */
  height: number;
}

/**
 * Message for showing the on-page dialog
 */
export interface ShowMessage extends Message {
  type: "onpage-dialog.show";
  /**
   * Browser engine name
   */
  platform: string;
}

/**
 * Information for initializing for on-page dialog
 */
export interface StartInfo {
  /**
   * On-page dialog content
   */
  content: DialogContent;
  /**
   * Locale information
   */
  localeInfo: LocaleInfo;
}
