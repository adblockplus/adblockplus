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

const { crypto } = self;

/**
 * Generates a v4 UUID using a cryptographically secure random number
 * generator.
 *
 * @returns A v4 UUID
 */
function generateUUID(): string {
  const uuid = new Uint16Array(8);
  crypto.getRandomValues(uuid);

  uuid[3] = (uuid[3] & 0x0fff) | 0x4000; // version 4
  uuid[4] = (uuid[4] & 0x3fff) | 0x8000; // variant 1

  const uuidChunks = [];
  for (let i = 0; i < uuid.length; i += 1) {
    const component = uuid[i].toString(16);
    uuidChunks.push(`000${component}`.slice(-4));
    if (i >= 1 && i <= 4) uuidChunks.push("-");
  }
  return uuidChunks.join("");
}

/**
 * Generates a v4 UUID using a cryptographically secure random number
 * generator. Will use Crypto.randomUUID() if available.
 *
 * @returns A v4 UUID
 */
export function getUUID(): string {
  return "randomUUID" in crypto ? crypto.randomUUID() : generateUUID();
}
