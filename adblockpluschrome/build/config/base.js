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
  basename: "adblockplus",
  version: "3.11.2",
  webpack: {
    bundles: [
      {
        dest: "background.js",
        src: [
          "adblockpluschrome/lib/devtools.js",
          "adblockpluschrome/lib/debug.js",
          "adblockpluschrome/lib/requestBlocker.js",
          "adblockpluschrome/lib/popupBlocker.js",
          "adblockpluschrome/lib/subscriptionInit.js",
          "lib/init.js",
          "adblockpluschrome/lib/filterComposer.js",
          "adblockpluschrome/lib/stats.js",
          "adblockpluschrome/lib/uninstall.js",
          "adblockpluschrome/lib/csp.js",
          "adblockpluschrome/lib/contentFiltering.js",
          "adblockpluschrome/lib/messageResponder.js",
          "adblockpluschrome/lib/filterConfiguration.js",
          "adblockpluschrome/lib/ml.js"
        ]
      },
      {
        dest: "include.preload.js",
        src: [
          "adblockpluschrome/include.preload.js",
          "adblockpluschrome/inject.preload.js",
          "adblockpluschrome/composer.preload.js"
        ]
      },
      {
        dest: "subscriptionLink.postload.js",
        src: [
          "adblockpluschrome/subscriptionLink.postload.js"
        ]
      }
    ]
  },
  mapping: {
    copy: [
      {
        dest: "skin",
        src: [
          "skin/**",
          "!skin/fonts/*00/**",
          "!skin/icons/toolbar/**",
          "!skin/icons/arrow.svg",
          "!skin/icons/logo/manifest/**",
          "!skin/icons/mobile/**",
          "!skin/mobile-options.css"
        ]
      },
      {
        dest: "icons/logo",
        src: [
          "skin/icons/logo/manifest/**"
        ]
      },
      {
        dest: "data",
        src: "data/*.json"
      },
      {
        dest: "data/mlHideIfGraphMatches",
        src: [
          // eslint-disable-next-line max-len
          "adblockpluschrome/adblockpluscore/data/mlHideIfGraphMatches/model.json",
          // eslint-disable-next-line max-len
          "adblockpluschrome/adblockpluscore/data/mlHideIfGraphMatches/group1-shard1of1.dat"
        ]
      },
      {
        dest: "ext",
        src: [
          "adblockpluschrome/ext/**"
        ]
      },
      {
        dest: "",
        src: [
          "*.js",
          "*.html",
          // marked as optional using wildcard
          "vendor/abp-snippets/dist/*snippets.min.js",
          "adblockpluschrome/options.*",
          "adblockpluschrome/devtools.*",
          "adblockpluschrome/polyfill.js",
          "!polyfill.js",
          "!mobile-options.*"
        ]
      }
    ],
    rename: [
      {
        dest: "icons/abp-16-notification.png",
        src: "skin/icons/toolbar/notification-16.png"
      },
      {
        dest: "icons/abp-16-allowlisted.png",
        src: "skin/icons/toolbar/disabled-16.png"
      },
      {
        dest: "icons/abp-16.png",
        src: "skin/icons/toolbar/default-16.png"
      },
      {
        dest: "icons/abp-20-notification.png",
        src: "skin/icons/toolbar/notification-20.png"
      },
      {
        dest: "icons/abp-20-allowlisted.png",
        src: "skin/icons/toolbar/disabled-20.png"
      },
      {
        dest: "icons/abp-20.png",
        src: "skin/icons/toolbar/default-20.png"
      },
      {
        dest: "icons/abp-32-notification.png",
        src: "skin/icons/toolbar/notification-32.png"
      },
      {
        dest: "icons/abp-32-allowlisted.png",
        src: "skin/icons/toolbar/disabled-32.png"
      },
      {
        dest: "icons/abp-32.png",
        src: "skin/icons/toolbar/default-32.png"
      },
      {
        dest: "icons/abp-40-notification.png",
        src: "skin/icons/toolbar/notification-40.png"
      },
      {
        dest: "icons/abp-40-allowlisted.png",
        src: "skin/icons/toolbar/disabled-40.png"
      },
      {
        dest: "icons/abp-40.png",
        src: "skin/icons/toolbar/default-40.png"
      }
    ]
  },
  translations: {
    dest: "_locales",
    src: [
      "locale/**/*.json",
      "!locale/*/mobile-options.json"
    ]
  }
};
