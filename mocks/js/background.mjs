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

import {port} from "./lib/messaging.mjs";
import {params} from "./config/env.mjs";

// this is imported instead of in a script tag to keep it
// in the same context for the port event emitter
import "./messageResponder.mjs";

(function()
{
  window.addEventListener("message", (event) =>
  {
    if (event.data.type != "message")
      return;
    const {payload: message, messageId} = event.data;
    const sender = {
      page: new ext.Page(event.source)
    };

    const listeners = port._listeners[message.type];

    if (!listeners)
      return;

    function reply(responseMessage)
    {
      event.source.postMessage({
        type: "response",
        messageId,
        payload: responseMessage
      }, "*");
    }

    for (const listener of listeners)
    {
      const response = listener(message, sender);
      if (response && typeof response.then == "function")
      {
        response.then(
          reply,
          (reason) =>
          {
            console.error(reason);
            reply();
          }
        );
      }
      else if (typeof response != "undefined")
      {
        reply(response);
      }
    }
  });

  if (params.addSubscription)
  {
    // We don't know how long it will take for the page to fully load
    // so we'll post the message after one second
    setTimeout(() =>
    {
      let url = "https://example.com/custom.txt";

      let title = "Custom subscription";
      switch (params.addSubscription)
      {
        case "title-none":
          title = null;
          break;
        // The extension falls back to the given URL
        // when the link doesn't specify a title
        // https://hg.adblockplus.org/adblockpluschrome/file/56f54c897e3a/subscriptionLink.postload.js#l86
        case "title-url":
          title = url;
          break;
        case "invalid":
          url = url.replace("https:", "http:");
          break;
      }

      window.postMessage({
        type: "message",
        payload: {
          title, url,
          confirm: true,
          type: "subscriptions.add"
        }
      }, "*");
    }, 1000);
  }

  if (params.showPageOptions)
  {
    // We don't know how long it will take for the page to fully load
    // so we'll post the message after one second
    setTimeout(() =>
    {
      window.postMessage({
        type: "message",
        payload: {
          type: "app.open",
          what: "options",
          action: "showPageOptions",
          args: [
            {
              host: "example.com",
              allowlisted: false
            }
          ]
        }
      }, "*");
    }, 1000);
  }
}());
