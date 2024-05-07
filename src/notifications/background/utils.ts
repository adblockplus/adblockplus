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

import { type Info } from "../../info/background/info.types";

export function applyLinkTemplating(url: string, info?: Info): string {
  let newUrl = url;

  if (info !== undefined) {
    const linkPlaceholders: Array<[key: string, getValue: () => string]> = [
      ["LANG", () => browser.i18n.getUILanguage().replace("-", "_")],
      ["ADDON_NAME", () => info.addonName],
      ["ADDON_VERSION", () => info.addonVersion],
      ["APPLICATION_NAME", () => info.application],
      ["APPLICATION_VERSION", () => info.applicationVersion],
      ["PLATFORM_NAME", () => info.platform],
      ["PLATFORM_VERSION", () => info.platformVersion]
    ];

    for (const [key, getValue] of linkPlaceholders) {
      newUrl = newUrl.replace(`%${key}%`, encodeURIComponent(getValue()));
    }
  }

  return newUrl;
}

export async function isTabAlreadyOpen(
  url: string,
  info: Info
): Promise<boolean> {
  try {
    const tabs = await browser.tabs.query({
      url: applyLinkTemplating(url, info)
    });
    return tabs.length > 0;
  } catch (error) {
    return false;
  }
}
