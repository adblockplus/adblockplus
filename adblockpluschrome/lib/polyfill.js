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

/** @module polyfill */

import webextPolyfill from "webextension-polyfill";

if (!("browser" in self))
  self.browser = webextPolyfill;

// chrome.i18n.getMessage is not available in service worker, so we need to
// unbreak it, while we're waiting for a fix to allow us to drop support for
// broken Chromium versions.
// https://bugs.chromium.org/p/chromium/issues/detail?id=1268098
// https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/-/issues/1079
if (!("getMessage" in browser.i18n))
{
  browser.i18n.getMessage = id =>
  {
    if (id == "@@bidi_dir")
      return "ltr";

    return "[UNTRANSLATED]";
  };
}

// browser.action and browser.browserAction are exclusive
// to Manifest v2 and v3 respectively
if (!("action" in browser))
  browser.action = browser.browserAction;

// Firefox (at least up to 93) does not support OffscreenCanvas
if (typeof OffscreenCanvas == "undefined")
{
  self.OffscreenCanvas = function(width, height)
  {
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };
}

// Some Node.js modules rely on the global reference.
self.global = self;
