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

  function Page(source)
  {
    this._source = source;
  }
  Page.prototype =
  {
    sendMessage(message)
    {
      this._source.postMessage({
        type: "message",
        messageId: -1,
        payload: message
      }, "*");
    }
  };

  window.ext.Page = Page;

  /* Message passing */

  window.ext.onMessage =
  {
    addListener(listener)
    {
      listener._extWrapper = function(event)
      {
        if (event.data.type != "message")
          return;

        let {messageId} = event.data;
        let sender = {
          page: new Page(event.source)
        };
        let callback = function(message)
        {
          event.source.postMessage({
            type: "response",
            messageId,
            payload: message
          }, "*");
        };
        listener(event.data.payload, sender, callback);
      };
      window.addEventListener("message", listener._extWrapper, false);
    },

    removeListener(listener)
    {
      if ("_extWrapper" in listener)
        window.removeEventListener("message", listener._extWrapper, false);
    }
  };

  class Port
  {
    constructor(name)
    {
      this._name = name;
    }

    get name()
    {
      return this._name;
    }

    get onDisconnect()
    {
      return {
        addListener() {}
      };
    }

    get onMessage()
    {
      let name = this._name;
      return {
        addListener(listener)
        {
          window.addEventListener("message", (event) =>
          {
            if (event.data.type != "port" || event.data.name != name)
              return;

            listener(event.data.payload);
          });
        }
      };
    }
  }
  window.ext._Port = Port;
}());
