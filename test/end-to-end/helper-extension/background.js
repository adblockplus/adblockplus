/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2020-present eyeo GmbH
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

"use strict";

// The timeout allows the ABP extension being ready
setTimeout(() =>
{
  chrome.management.getAll(extensions =>
  {
    for (const extension of extensions)
    {
      if (extension.type == "extension" &&
          extension.installType == "development" &&
          extension.id != chrome.runtime.id &&
          extension.name != "Chrome Automation Extension")
      {
        chrome.tabs.create({url: extension.optionsUrl});
        return;
      }
    }
  });
}, 1000);
