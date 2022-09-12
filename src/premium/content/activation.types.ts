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
 * Payload of event for acknowledging that the user has paid
 * for a Premium license
 *
 * This interface is declared by the Premium backend.
 */
export interface PaymentAcknowledgedPayload {
  /**
   * Whether the extension acknowledges that the user has paid
   * for a Premium license
   */
  ack: true;
}

/**
 * Event received from a trusted web page to indicate that user has paid
 * for a Premium license
 *
 * This interface is declared by the Premium backend.
 */
export interface PaymentSuccessPayload {
  /**
   * Premium API command
   */
  command: "payment_success";
  /**
   * Premium user ID
   */
  userId: string;
  /**
   * Premium API version
   */
  version: 1;
}
