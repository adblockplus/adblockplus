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

import {Port} from "../shared/index.mjs";
import {sendMessageToBackground} from "./messaging.mjs";

let maxMessageId = -1;
// We initialize the ID using a random value to avoid
// potential conflicts with other IDs
let portId = Math.random();

export function connect({name})
{
  const id = ++portId;
  const port = new Port(id, name);
  sendMessageToBackground({type: "connect", id, name});
  return port;
}

export function getBrowserInfo()
{
  return Promise.resolve({
    name: "adblockplusfirefox",
    buildID: "20161018004015"
  });
}

export const onMessage = {
  addListener() {},
  removeListener() {}
};

export const sendMessage = message =>
{
  const messageId = ++maxMessageId;
  sendMessageToBackground({
    type: "message",
    messageId,
    payload: message
  });

  let resolvePromise = null;
  const callbackWrapper = event =>
  {
    if (event.data.type == "response" && event.data.messageId == messageId)
    {
      window.removeEventListener("message", callbackWrapper);
      resolvePromise(event.data.payload);
    }
  };
  window.addEventListener("message", callbackWrapper);

  return new Promise((resolve, reject) =>
  {
    resolvePromise = resolve;
  });
};
