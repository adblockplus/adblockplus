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

import { type Info } from "../../info/background/info.types";
import { applyLinkTemplating, isTabAlreadyOpen } from "./utils";

describe("notifications/background/utils", () => {
  beforeEach(() => {
    jest.spyOn(browser.i18n, "getUILanguage").mockReturnValue("en-US");
  });

  describe("applyLinkTemplating", () => {
    it("works with empty url", () => {
      const url = "";
      const info: Info = {
        baseName: "adblockplus",
        addonName: "adblockpluschrome",
        addonVersion: "10.0.0",
        application: "unknown",
        applicationVersion: "100",
        platform: "chromium",
        platformVersion: "100"
      };

      const result = applyLinkTemplating(url, info);

      expect(result).toBe("");
    });

    it("works with empty info", () => {
      const url = "https://google.com";

      const result = applyLinkTemplating(url);

      expect(result).toBe(url);
    });

    it("replaces placeholders with values", () => {
      const url =
        "https://example.com/%LANG%/path/%ADDON_NAME%?addonVersion=%ADDON_VERSION%&application=%APPLICATION_NAME%";
      const info: Info = {
        baseName: "adblockplus",
        addonName: "adblockpluschrome",
        addonVersion: "10.0.0",
        application: "unknown",
        applicationVersion: "100",
        platform: "chromium",
        platformVersion: "100"
      };

      const result = applyLinkTemplating(url, info);

      expect(result).toBe(
        "https://example.com/en_US/path/adblockpluschrome?addonVersion=10.0.0&application=unknown"
      );
    });
  });

  describe("isTabAlreadyOpen", () => {
    it("returns true if a tab with the same url exists", async () => {
      const url = "https://example.com";
      const info: Info = {
        baseName: "adblockplus",
        addonName: "adblockpluschrome",
        addonVersion: "10.0.0",
        application: "unknown",
        applicationVersion: "100",
        platform: "chromium",
        platformVersion: "100"
      };

      jest.spyOn(browser.tabs, "query").mockResolvedValue([
        {
          id: 1,
          index: 0,
          windowId: 1,
          active: true,
          pinned: false,
          discarded: false,
          highlighted: true,
          incognito: false,
          url: "https://example.com"
        }
      ]);

      await expect(isTabAlreadyOpen(url, info)).resolves.toBe(true);
    });

    it("returns false if a tab with the same url does not exist", async () => {
      const url = "https://example.com";
      const info: Info = {
        baseName: "adblockplus",
        addonName: "adblockpluschrome",
        addonVersion: "10.0.0",
        application: "unknown",
        applicationVersion: "100",
        platform: "chromium",
        platformVersion: "100"
      };

      jest.spyOn(browser.tabs, "query").mockResolvedValue([]);

      await expect(isTabAlreadyOpen(url, info)).resolves.toBe(false);
    });

    it("works with templated urls", async () => {
      const url =
        "https://example.com/%LANG%/path/%ADDON_NAME%?addonVersion=%ADDON_VERSION%&application=%APPLICATION_NAME%";
      const info: Info = {
        baseName: "adblockplus",
        addonName: "adblockpluschrome",
        addonVersion: "10.0.0",
        application: "unknown",
        applicationVersion: "100",
        platform: "chromium",
        platformVersion: "100"
      };

      jest.spyOn(browser.tabs, "query").mockResolvedValue([
        {
          id: 1,
          index: 0,
          windowId: 1,
          active: true,
          pinned: false,
          discarded: false,
          highlighted: true,
          incognito: false,
          url: "https://example.com/en_US/path/adblockpluschrome?addonVersion=10.0.0&application=unknown"
        }
      ]);

      const result = await isTabAlreadyOpen(url, info);

      expect(browser.tabs.query).toHaveBeenCalledWith({
        url: "https://example.com/en_US/path/adblockpluschrome?addonVersion=10.0.0&application=unknown"
      });

      expect(result).toBe(true);
    });
  });
});
