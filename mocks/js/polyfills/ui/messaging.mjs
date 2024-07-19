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

let backgroundFrame;
let messageQueue = [];

function loadHandler(event)
{
  if (event.data.type == "backgroundPageLoaded")
  {
    const queue = messageQueue;
    messageQueue = null;
    if (queue)
    {
      for (const message of queue)
        backgroundFrame.contentWindow.postMessage(message, "*");
    }
    window.removeEventListener("message", loadHandler);
  }
}

function postMessage(msg)
{
  sendMessageToBackground({
    type: "port",
    id: this._id,
    payload: msg
  });
}

export function sendMessageToBackground(message)
{
  if (messageQueue)
    messageQueue.push(message);
  else
    backgroundFrame.contentWindow.postMessage(message, "*");
}

export function start()
{
  backgroundFrame = document.createElement("iframe");
  backgroundFrame.setAttribute(
    "src",
    `mocks/background.html${location.search}`
  );
  backgroundFrame.style.display = "none";

  window.addEventListener("DOMContentLoaded", () =>
  {
    document.body.appendChild(backgroundFrame);
  });
  window.addEventListener("message", loadHandler);

  Port.prototype.postMessage = postMessage;
}
