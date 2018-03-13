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

  window.addEventListener("load", () =>
  {
    parent.postMessage({
      type: "backgroundPageLoaded"
    }, "*");
  }, false);

  window.ext.devtools = {
    onCreated: {
      addListener(listener)
      {
        window.addEventListener("message", (event) =>
        {
          if (event.data.type == "devtools")
            listener(new ext.Page(event.source));
        });
      }
    }
  };

  /* Message passing */

  if (!("runtime" in browser))
    browser.runtime = {};

  function postMessage(msg)
  {
    parent.postMessage({
      type: "port",
      name: this._name,
      payload: msg
    }, "*");
  }
  ext._Port.prototype.postMessage = postMessage;

  function onConnect(listener)
  {
    window.addEventListener("message", (event) =>
    {
      if (event.data.type != "connect")
        return;

      listener(new ext._Port(event.data.name));
    });
  }
  window.browser.runtime.onConnect = {addListener: onConnect};
}());
