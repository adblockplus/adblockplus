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

/**
 * A list of origins where we want to inject the info.
 */
export const injectionOrigins = [
  "https://adblockplus.org",
  "https://accounts.adblockplus.org",
  "https://new.adblockplus.org",
  "https://welcome.adblockplus.org",
  "https://getadblock.com",
  "https://vpn.getadblock.com"
];

/**
 * The info we inject.
 */
export interface InjectionInfo {
  /**
   * Whether the user is a premium user
   */
  isPremium: boolean;
  /**
   * The version of the extension
   */
  version: string;
  /**
   * The installation id
   */
  id: string;
  /**
   * The premium user id
   */
  premiumId: string;
}
