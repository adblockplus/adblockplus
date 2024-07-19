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

import * as i18n from "./i18n.mjs";

export const mockBrowser = {
  contentSettings: {
    cookies: {
      get(details)
      {
        return Promise.resolve({setting: "allow"});
      }
    },
    javascript: {
      get(details)
      {
        return Promise.resolve({setting: "allow"});
      }
    }
  },

  devtools: {
    panels: {
      openResource: (url) => window.open(url)
    },

    inspectedWindow: {
      reload: () => location.reload()
    }
  },

  i18n,

  management: {
    getAll()
    {
      return Promise.resolve([
        {
          enabled: true,
          id: "cfhdojbkjhnklbpkdaibdccddilifddb",
          name: "Adblock Plus",
          type: "extension",
          version: "3.4"
        }
      ]);
    }
  },

  runtime: {
    getManifest()
    {
      const manifestversionMatch = /[?&]manifestVersion=(\d)/.exec(
        window.top.location.search
      );
      const manifestVersion = (manifestversionMatch) ?
        parseInt(manifestversionMatch[1], 10) :
        2;

      return {
        manifest_version: manifestVersion
      };
    }
  }
};
