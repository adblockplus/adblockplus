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

// Object.values is not supported in Chrome <54.
if (!("values" in Object))
  Object.values = obj => Object.keys(obj).map(key => obj[key]);

// Firefox <56 separates the locale parts with an underscore instead of a dash.
// https://bugzilla.mozilla.org/show_bug.cgi?id=1374552
let {getUILanguage} = browser.i18n;
browser.i18n.getUILanguage = function()
{
  return getUILanguage().replace("_", "-");
};

// Chrome <69 does not support OffscreenCanvas
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
