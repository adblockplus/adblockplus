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

import {log} from "./logger.mjs";

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

export function start()
{
  window.XMLHttpRequest = MockXmlHttpRequest;
}
