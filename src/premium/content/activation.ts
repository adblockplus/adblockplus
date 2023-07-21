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
  PaymentAcknowledgedPayload,
  PaymentSuccessPayload
} from "./activation.types";

const trustedOrigin = "https://accounts.adblockplus.org";

/**
 * Receives and responds to "payment_success" event
 *
 * @param event - Message event
 */
async function onMessage(
  event: MessageEvent<PaymentSuccessPayload>
): Promise<void> {
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

  try {
    const isSuccess = await api.premium.activate(data.userId);
    if (!isSuccess) {
      throw new Error("Error in background page");
    }

    window.postMessage(
      { ack: true } as PaymentAcknowledgedPayload,
      event.origin
    );
  } catch (ex) {
    console.error("Failed to activate Premium license", ex);
  }
}
window.addEventListener("message", onMessage);
