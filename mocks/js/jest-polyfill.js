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

"use strict";

/**
 * This file is extending the browser object created by jest-webextension-mock.
 * jest-webextension-mock misses a few webext APIs that are used in our
 * codebase, so we add them during the jest setup.
 */


Object.assign(browser.tabs, {onRemoved: {
  addListener() {},
  removeListener() {},
  hasListener() {}
}});

Object.assign(browser.runtime, {
  getPlatformInfo()
  {
    return new Promise((resolve) =>
    {
      resolve({os: "jest"});
    });
  },
  getManifest()
  {
    return {
      manifest_version: 3,
      options_ui: {
        page: "options.html"
      }
    };
  }
});

Object.assign(browser, {
  management: {
    getSelf()
    {
      return new Promise((resolve) =>
      {
        resolve({
          installType: "normal"
        });
      });
    }
  }
});

Object.assign(browser, {
  webRequest: {
    onBeforeRequest() {},
    ResourceType: {}
  }
});

Object.assign(browser, {
  action: browser.browserAction
});
