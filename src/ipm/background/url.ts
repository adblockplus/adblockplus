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

import { Prefs } from "../../../adblockpluschrome/lib/prefs";

/**
 * Constructs a URL based on the given URL and a trusted origin. If `url` is
 * relative, the given origin is used. If `url` is absolute, it's origin will
 * be checked whether it matches the trusted origin.
 *
 * @param url The URL to create the safe origin URL from. Can be relative
 *   or absolute
 *
 * @returns An absolute URL with a trusted origin, or `null` if creating a
 *   safe origin URL was not possible, or if origins did not match.
 */
export function createSafeOriginUrl(url: string): string | null {
  const safeOrigin = Prefs.get("ipm_safe_origin");
  let safeOriginUrl: URL;

  try {
    safeOriginUrl = new URL(url, safeOrigin);
  } catch (ex) {
    return null;
  }

  // Verify that provided URL didn't override the intended target origin
  if (safeOriginUrl.origin !== safeOrigin) {
    return null;
  }

  return safeOriginUrl.href;
}
