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

"use strict";

(function()
{
  if (typeof ext == "undefined")
    window.ext = {};

  let backgroundFrame = document.createElement("iframe");
  backgroundFrame.setAttribute("src",
                               "background.html" + window.location.search);
  backgroundFrame.style.display = "none";
  window.addEventListener("DOMContentLoaded", () =>
  {
    document.body.appendChild(backgroundFrame);
  }, false);

  let messageQueue = [];
  let maxMessageId = -1;
  let loadHandler = (event) =>
  {
    if (event.data.type == "backgroundPageLoaded")
    {
      let queue = messageQueue;
      messageQueue = null;
      if (queue)
      {
        for (let message of queue)
          backgroundFrame.contentWindow.postMessage(message, "*");
      }
      window.removeEventListener("message", loadHandler, false);
    }
  };
  window.addEventListener("message", loadHandler, false);

  ext.backgroundPage = {
    _sendRawMessage(message)
    {
      if (messageQueue)
        messageQueue.push(message);
      else
        backgroundFrame.contentWindow.postMessage(message, "*");
    },
    sendMessage(message, responseCallback)
    {
      let messageId = ++maxMessageId;

      this._sendRawMessage({
        type: "message",
        messageId,
        payload: message
      });

      if (responseCallback)
      {
        let callbackWrapper = function(event)
        {
          if (event.data.type == "response" &&
              event.data.messageId == messageId)
          {
            window.removeEventListener("message", callbackWrapper, false);
            responseCallback(event.data.payload);
          }
        };
        window.addEventListener("message", callbackWrapper, false);
      }
    }
  };
}());
