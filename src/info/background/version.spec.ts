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

import { getMajorVersion } from "./version";

describe("info", () => {
  describe("getMajorVersion", () => {
    it("should return the correct major version for a well formatted semver string", () => {
      let version = "1.2.3";
      let major = getMajorVersion(version);

      expect(major).toBe("1");

      version = "54321.98765.65434212-alpha3";
      major = getMajorVersion(version);

      expect(major).toBe("54321");
    });

    it("should not throw when the empty string is passed", () => {
      const version = "";
      const func = (): void => {
        getMajorVersion(version);
      };

      expect(func).not.toThrow();
    });

    it("should not throw when a non-conforming version string is passed", () => {
      const version = "Not..A..Semver..Version";
      const func = (): void => {
        getMajorVersion(version);
      };

      expect(func).not.toThrow();
    });
  });
});
