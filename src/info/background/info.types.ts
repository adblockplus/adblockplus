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

/**
 * An interface describing some information about the extension, the type of
 * build, and the browser the extension is running in. Some of the values are
 * being set during build time, and some during runtime.
 */
export interface Info {
  /**
   * The base name of the extension. Always "adblockplus".
   */
  baseName: "adblockplus";
  /**
   * The name of the extension build,
   * e.g. "adblockpluschrome" or "adblockplusfirefox".
   */
  addonName: string;
  /**
   * The extension version.
   */
  addonVersion: string;
  /**
   * The name of the browser the extension is running in,
   * e.g. "chrome", "edge", "firefox", "opera", "unknown".
   */
  application: string;
  /**
   * The version of the browser.
   */
  applicationVersion: string;
  /**
   * The name of the browser platform.
   */
  platform: "chromium" | "gecko";
  /**
   * The version of the browser platform.
   */
  platformVersion: string;
}
