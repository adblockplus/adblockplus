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

import { compareVersions, getMajorVersion } from "./version";

describe("version", () => {
  describe("compareVersions", () => {
    describe("with Semver arguments", () => {
      it("Returns 1 if the first version is more recent than the second", () => {
        expect(compareVersions("1.2.3", "1.2.1")).toEqual(1);
        expect(compareVersions("2", "1")).toEqual(1);
        expect(compareVersions("2.2", "2")).toEqual(1);
        expect(compareVersions("2.2", "2.1")).toEqual(1);
        expect(compareVersions("100000", "100")).toEqual(1);

        expect(compareVersions("0.0.0", "0.0.0alpha")).toEqual(1);
        expect(compareVersions("0.1beta", "0.1alpha")).toEqual(1);
      });

      it("Returns -1 if the first version is older than the second", () => {
        expect(compareVersions("1.2.1", "1.2.3")).toEqual(-1);
        expect(compareVersions("1", "2")).toEqual(-1);
        expect(compareVersions("2", "2.2")).toEqual(-1);
        expect(compareVersions("2.1", "2.2")).toEqual(-1);
        expect(compareVersions("-1", "0")).toEqual(-1);

        expect(compareVersions("0.0.0alpha", "0.0.0")).toEqual(-1);
        expect(compareVersions("0.1alpha", "0.1beta")).toEqual(-1);
      });

      it("Returns 0 if the versions are the same", () => {
        expect(compareVersions("1", "1")).toEqual(0);
        expect(compareVersions("23.4.5", "23.4.5")).toEqual(0);
        expect(compareVersions("-1", "-1")).toEqual(0);
      });
    });

    describe("with non semver arguments", () => {
      it("considers * to be more recent than any number", () => {
        expect(compareVersions("*", "1234.234.157")).toEqual(1);
        expect(compareVersions("2.*", "2.1")).toEqual(1);
      });

      it("considers semver version to be more recent than lettered versions", () => {
        expect(compareVersions("1.2.3", "foobar")).toEqual(1);
        expect(compareVersions("foobar", "0.0.1")).toEqual(-1);
      });

      it("does simple string comparison (v1 > v2 ? 1 : -1) for non-semver arguments", () => {
        expect(compareVersions("b", "a")).toEqual(1);
        expect(compareVersions("b", "A")).toEqual(1);
        expect(compareVersions("foo", "bar")).toEqual(1);

        expect(compareVersions("a", "b")).toEqual(-1);
        expect(compareVersions("foo", "bar")).toEqual(1);

        expect(compareVersions("adblock", "adblock")).toEqual(0);
      });

      it("returns 0 when the arguments are emojis 😅", () => {
        expect(compareVersions("👍", "✅")).toEqual(0);
        expect(compareVersions("👨‍👩‍👧", "👨‍👩‍👦‍👦")).toEqual(0);
      });
    });
  });

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
