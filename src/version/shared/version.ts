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

function parseVersionComponent(comp: string): number {
  if (comp === "*") {
    return Infinity;
  }
  const parsed = parseInt(comp, 10);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

/**
 * Compares two versions.
 * @returns {number} `-1` if `v1` is older than `v2`; `1` if `v1` is newer than `v2`; otherwise `0`.
 */
export function compareVersions(v1: string, v2: string): -1 | 1 | 0 {
  const regexp = /^(.*?)([a-z].*)?$/i;
  const [, head1, tail1] = regexp.exec(v1) ?? [];
  const [, head2, tail2] = regexp.exec(v2) ?? [];
  const components1 = head1.split(".");
  const components2 = head2.split(".");

  for (let i = 0; i < components1.length || i < components2.length; i++) {
    const result =
      parseVersionComponent(components1[i]) -
      parseVersionComponent(components2[i]);

    if (result < 0) {
      return -1;
    }

    if (result > 0) {
      return 1;
    }
  }

  // Compare version suffix (e.g. 0.1alpha < 0.1b1 < 01.b2 < 0.1).
  // However, note that this is a simple string comparison, meaning: b10 < b2
  if (tail1 === tail2) {
    return 0;
  }

  if (tail1 === undefined || (tail2 !== undefined && tail1 > tail2)) {
    return 1;
  }

  return -1;
}

/**
 * Parses a SemVer compatible version string like "1.2.3-alpha" and returns
 * the major version.
 *
 * @param version The version string to obtain the major version from
 */
export function getMajorVersion(version: string): string {
  const majorVersion = version.split(".").shift();
  return typeof majorVersion === "string" ? majorVersion : "0";
}
