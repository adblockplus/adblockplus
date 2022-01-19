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

/** @module contentFiltering */

import * as ewe from "../../vendor/webext-sdk/dist/ewe-api.js";

(async() =>
{
  try
  {
    let response = await fetch(
      browser.runtime.getURL("/snippets.json"),
      {cache: "no-cache"}
    );
    if (!response.ok)
      return;

    let snippets = await response.json();
    ewe.snippets.setLibrary(
      snippets.isolatedCode,
      snippets.injectedCode,
      snippets.injectedList
    );
  }
  catch (e)
  {
    // If the request fails, the snippets library is not
    // bundled with the extension, so we silently ignore this error.
  }
})();
