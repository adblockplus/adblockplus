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
  version: "4.3",
  webpack: {
    bundles: [
      {
        dest: "background.js",
        src: [
          "adblockpluschrome/lib/serviceworkerInit.js",
          "src/bootstrap/background/bootstrap.entry.ts"
        ]
      },
      {
        dest: "bypass.preload.js",
        src: ["src/bypass/content/index.ts"]
      },
      {
        dest: "composer.js",
        src: ["src/composer/ui/index.ts"]
      },
      {
        dest: "composer.preload.js",
        src: ["src/composer/content/index.ts"]
      },
      {
        dest: "day1.js",
        src: ["js/pages/day1.mjs"]
      },
      {
        dest: "desktop-options.js",
        src: ["js/pages/desktop-options/index.mjs"]
      },
      {
        dest: "devtools.js",
        src: ["src/devtools/ui/index.ts"]
      },
      {
        dest: "devtools-panel.js",
        src: ["js/pages/devtools-panel/index.mjs"]
      },
      {
        dest: "first-run.js",
        src: ["js/pages/first-run.mjs"]
      },
      {
        dest: "issue-reporter.js",
        src: ["js/pages/issue-reporter/index.mjs"]
      },
      {
        dest: "onpage-dialog.preload.js",
        src: ["src/onpage-dialog/content/index.ts"]
      },
      {
        dest: "onpage-dialog-ui.preload.js",
        src: ["src/onpage-dialog/content-ui/index.ts"]
      },
      {
        dest: "options.js",
        src: ["src/options/ui/index.ts"]
      },
      {
        dest: "polyfill.js",
        src: ["adblockpluschrome/lib/polyfill.js"]
      },
      {
        dest: "popup.js",
        src: ["js/pages/popup/index.mjs"]
      },
      {
        dest: "popup-dummy.js",
        src: ["js/pages/popup-dummy.mjs"]
      },
      {
        dest: "premium.preload.js",
        src: ["src/premium/content/index.ts"]
      },
      {
        dest: "premium-onboarding.js",
        src: ["src/premium-onboarding/ui/index.ts"]
      },
      {
        dest: "premium-onboarding.preload.js",
        src: ["src/premium-onboarding/content/index.ts"]
      },
      {
        dest: "options.preload.js",
        src: ["src/options/content/index.ts"]
      },
      {
        dest: "problem.js",
        src: ["js/pages/problem.mjs"]
      },
      {
        dest: "updates.js",
        src: ["js/pages/updates.mjs"]
      },
      {
        dest: "yt-wall-detection.preload.js",
        src: ["src/yt-wall-detection/content/index.ts"]
      },
      {
        dest: "info-injector.preload.js",
        src: ["src/info-injector/content/index.ts"]
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
          "!skin/icons/mobile/**"
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
        dest: "ext",
        src: [
          "adblockpluschrome/ext/**"
        ]
      },
      {
        dest: "",
        src: [
          "src/composer/ui/composer.html",
          "src/day1/ui/day1.html",
          "src/desktop-options/ui/desktop-options.html",
          "src/devtools-panel/ui/devtools-panel.html",
          "src/devtools/ui/devtools.html",
          "src/first-run/ui/first-run.html",
          "src/issue-reporter/ui/issue-reporter.html",
          "src/issue-reporter/ui/proxy.html",
          "src/mobile-options/ui/mobile-options.html",
          "src/options/ui/options.html",
          "src/popup-dummy/ui/popup-dummy.html",
          "src/popup/ui/popup.html",
          "src/problem/ui/problem.html",
          "src/updates/ui/updates.html"
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
      },
      {
        dest: "skin/onpage-dialog.css",
        src: "src/onpage-dialog/content/frame.css"
      },
      {
        dest: "vendor/@eyeo/webext-ad-filtering-solution/content.js",
        src:
          "node_modules/@eyeo/webext-ad-filtering-solution/dist/ewe-content.js"
      },
      {
        dest: "premium-onboarding.html",
        src: "src/premium-onboarding/ui/onboarding.html"
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
