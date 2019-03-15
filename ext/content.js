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
  function log(...args)
  {
    // eslint-disable-next-line no-console
    console.log("MOCK", ...args);
  }

  if (typeof ext == "undefined")
    window.ext = {};

  const backgroundFrame = document.createElement("iframe");
  backgroundFrame.setAttribute("src",
                               "background.html" + window.location.search);
  backgroundFrame.style.display = "none";
  window.addEventListener("DOMContentLoaded", () =>
  {
    document.body.appendChild(backgroundFrame);
  });

  let messageQueue = [];
  let maxMessageId = -1;
  const loadHandler = (event) =>
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

  browser.runtime.sendMessage = message =>
  {
    const messageId = ++maxMessageId;
    ext.backgroundPage._sendRawMessage({
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

  // We initialize the ID using a random value to avoid
  // potential conflicts with other IDs
  let portId = Math.random();

  function postMessage(msg)
  {
    ext.backgroundPage._sendRawMessage({
      type: "port",
      id: this._id,
      payload: msg
    });
  }
  ext._Port.prototype.postMessage = postMessage;

  function connect({name})
  {
    const id = ++portId;
    const port = new ext._Port(id, name);
    ext.backgroundPage._sendRawMessage({type: "connect", id, name});
    return port;
  }
  browser.runtime.connect = connect;

  const getTab = (url) => ({id: ++tabCounter, url});

  let tabCounter = 0;
  let activeTab = getTab("https://example.com/");
  const tabs = new Map([
    [activeTab.id, activeTab]
  ]);

  if (!("tabs" in browser))
    browser.tabs = {};

  browser.tabs.captureVisibleTab = (tabId, options) =>
  {
    log(`Take screenshot of tab with ID ${tabId || activeTab.id}`);
    return fetch("../tests/image.base64.txt")
      .then(body => body.text());
  };

  browser.tabs.create = (options) =>
  {
    const tab = getTab(options.url);
    tabs.set(tab.id, tab);
    log(`Created tab '${tab.url}' with ID ${tab.id}`);

    if (options.active)
    {
      activeTab = tab;
      log(`Focused tab with ID ${activeTab.id}`);
    }

    return Promise.resolve(tab);
  };

  browser.tabs.get = (tabId) =>
  {
    const tab = tabs.get(tabId);
    if (!tab)
      return Promise.reject(new Error(`Tab with ID ${tabId} cannot be found`));

    return Promise.resolve(tab);
  };

  browser.tabs.getCurrent = () => Promise.resolve(activeTab);

  browser.tabs.onUpdated = {
    addListener() {}
  };

  browser.tabs.remove = (tabId) =>
  {
    log(`Closed tab: ${tabs.get(tabId).url}`);
    tabs.delete(tabId);
    return Promise.resolve();
  };

  browser.tabs.update = (tabId, options) =>
  {
    if (options.active)
    {
      activeTab = tabs.get(tabId);
      log(`Focused tab with ID ${activeTab.id}`);
    }
    return Promise.resolve();
  };

  class MockXmlHttpRequest extends XMLHttpRequest
  {
    get responseText()
    {
      if (typeof this._responseText === "undefined")
        return super.responseText;

      return this._responseText;
    }

    get status()
    {
      if (typeof this._status === "undefined")
        return super.status;

      return this._status;
    }

    open(method, url, ...args)
    {
      super.open(method, url, ...args);
      this._method = method.toLowerCase();
      this._url = url;
    }

    send(body)
    {
      // We're only intercepting data that is sent to the server
      if (this._method !== "post")
      {
        super.send(body);
        return;
      }

      try
      {
        log("Sent request", this._url);

        this._status = 200;
        this._responseText = `
          <a download href="data:text/xml;utf-8,${encodeURIComponent(body)}">
            Download issue report as XML
          </a>
        `;

        const event = new CustomEvent("load");
        this.dispatchEvent(event);
      }
      catch (ex)
      {
        console.error(ex);
      }
    }
  }
  window.XMLHttpRequest = MockXmlHttpRequest;
}());
