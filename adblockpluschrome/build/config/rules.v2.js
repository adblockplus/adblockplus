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

export default {
  mapping: {
    copy: [],
    rename: [
      // EWE 0.6.0 still requires the old index file format for Manifest v2,
      // so we cannot use the one from @adblockinc/rules yet for both versions
      // https://gitlab.com/eyeo/adblockplus/abc/webext-sdk/-/issues/353
      {
        dest: "data/rules/index.json",
        src: "adblockpluschrome/build/rules.v2.json"
      }
    ]
  }
};
