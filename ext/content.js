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
  });

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
      window.removeEventListener("message", loadHandler);
    }
  };
  window.addEventListener("message", loadHandler);

  ext.backgroundPage = {
    _sendRawMessage(message)
    {
      if (messageQueue)
        messageQueue.push(message);
      else
        backgroundFrame.contentWindow.postMessage(message, "*");
    }
  };

  /* Message passing */

  if (!("runtime" in browser))
    browser.runtime = {};

  browser.runtime.sendMessage = (message, responseCallback) =>
  {
    let messageId = ++maxMessageId;
    ext.backgroundPage._sendRawMessage({
      type: "message",
      messageId,
      payload: message
    });

    let resolvePromise = null;
    let callbackWrapper = event =>
    {
      if (event.data.type == "response" && event.data.messageId == messageId)
      {
        window.removeEventListener("message", callbackWrapper);
        resolvePromise(event.data.payload);
      }
    };
    window.addEventListener("message", callbackWrapper);
    if (responseCallback)
    {
      resolvePromise = responseCallback;
    }
    else
    {
      return new Promise((resolve, reject) =>
      {
        resolvePromise = resolve;
      });
    }
  };

  function postMessage(msg)
  {
    ext.backgroundPage._sendRawMessage({
      type: "port",
      name: this._name,
      payload: msg
    });
  }
  ext._Port.prototype.postMessage = postMessage;

  function connect({name})
  {
    ext.backgroundPage._sendRawMessage({type: "connect", name});
    return new ext._Port(name);
  }
  browser.runtime.connect = connect;

  if (!("tabs" in browser))
    browser.tabs = new Map([[0, {url: "example.com"}]]);

  browser.tabs.get = (...args) =>
  {
    // Extend browser.tabs.get()
    const result = Map.prototype.get.apply(browser.tabs, args);
    return (result ? Promise.resolve(result) :
      Promise.reject(new Error("Tab cannot be found")));
  };
}());
