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
 * DOM event with data that we can safely interact with
 */
export interface TrustedEvent extends CustomEvent {}

/**
 * DOM event for requesting payload to verify
 * authenticity of Premium license data
 */
export interface AuthRequestEvent extends TrustedEvent {
  detail: {
    /**
     * Signature for verifying authenticity of sender
     */
    signature: string;

    /**
     * Timestamp corresponding to current date and time
     */
    timestamp: number;
  };
}
