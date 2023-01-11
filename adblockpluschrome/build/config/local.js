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
  extends: "base",
  webpack: {
    bundles: [
      {
        dest: "background.js",
        src: ["mocks/js/background.mjs"],
        overwrite: true
      },
      {
        dest: "polyfill.js",
        src: ["polyfill.js"],
        overwrite: true
      },
      // Specific to Firefox Mobile
      {
        dest: "mobile-options.js",
        src: ["js/pages/mobile-options.mjs"]
      }
    ]
  },
  mapping: {
    copy: [
      {
        dest: "ext",
        src: ["ext/**"]
      },
      {
        dest: "locale",
        src: ["locale/**"]
      },
      {
        dest: "mocks",
        src: ["mocks/background.html"]
      },
      {
        dest: "mocks/data",
        src: ["mocks/data/**"]
      },
      // Specific to Firefox Mobile
      {
        dest: "skin",
        src: [
          "skin/icons/mobile/**",
          "skin/mobile-options.css"
        ]
      },
      {
        dest: "",
        src: ["mobile-options.html"]
      }
    ],
    rename: []
  }
};
