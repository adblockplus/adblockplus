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
 * Premium license
 *
 * This interface is declared by the Premium backend.
 */
export interface License {
  /**
   * License version
   */
  lv: 1;

  /**
   * License status
   */
  status: "active" | "expired";

  /**
   * License code
   *
   * Optional as the Premium server only sends it
   * in the first license check calls.
   */
  code?: string;

  /**
   * Encoded license data
   */
  encodedData: string;

  /**
   * Signature for encoded license data
   */
  signature: string;
}

/**
 * Payload of license check HTTP request
 *
 * This interface is declared by the Premium backend.
 */
export interface LicenseCheckPayload {
  /**
   * Premium API command
   */
  cmd: "license_check";
  /**
   * Premium user ID
   */
  u: string;
  /**
   * Premium API version
   */
  v: "1";
}

/**
 * Premium state information
 */
export interface PremiumState {
  /**
   * Whether the user has an active Premium license
   */
  isActive: boolean;
}
