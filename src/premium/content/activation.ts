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

import api from "../../core/api/front";

import {
  type PaymentAcknowledgedPayload,
  type PaymentSuccessPayload
} from "./activation.types";

const trustedOrigin = "https://accounts.adblockplus.org";

/**
 * Receives and responds to "payment_success" event
 *
 * @param event - Message event
 */
function onMessage(event: MessageEvent<PaymentSuccessPayload>): void {
  if (event.origin !== trustedOrigin) {
    return;
  }

  const { data } = event;
  if (
    data.version !== 1 ||
    data.command !== "payment_success" ||
    !data.userId
  ) {
    console.error("Received invalid message");
    return;
  }

  window.removeEventListener("message", onMessage);

  void activateLicense(data.userId, event.origin);
}

/**
 * Tries to activate premium for the given user ID. Will respond to the given
 * origin if activation was successful.
 *
 * @param userId The user ID to activate
 * @param origin The message origin to return the ack signal to
 */
async function activateLicense(userId: string, origin: string): Promise<void> {
  try {
    const isSuccess = await api.premium.activate(userId);
    if (!isSuccess) {
      throw new Error("Error in background page");
    }

    const payload: PaymentAcknowledgedPayload = { ack: true };
    window.postMessage(payload, origin);
  } catch (ex) {
    console.error("Failed to activate Premium license", ex);
  }
}

/**
 * Initializes Premium activation trigger
 */
function start(): void {
  window.addEventListener("message", onMessage);
}

start();
