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

  function PageMap()
  {
    this._keys = [];
    this._values = [];
  }
  PageMap.prototype = {
    keys()
    {
      return this._keys.map((source) =>
      {
        return new window.ext.Page(source);
      });
    },

    get(page)
    {
      return this._values[this._keys.indexOf(page._source)];
    },

    set(page, value)
    {
      let index = this._keys.indexOf(page._source);
      if (index < 0)
      {
        index = this._keys.push(page._source) - 1;

        let callback = function()
        {
          page._source.removeEventListener("unload", callback, false);
          this.delete(page);
        }.bind(this);
        page._source.addEventListener("unload", callback, false);
      }
      this._values[index] = value;
    },

    delete(page)
    {
      let index = this._keys.indexOf(page._source);
      if (index >= 0)
      {
        this._keys.splice(index, 1);
        this._values.splice(index, 1);
      }
    }
  };

  window.ext.PageMap = PageMap;

  window.ext.showOptions = function(callback)
  {
    if (!/\/(?:mobile|new)-options\.html/.test(top.location.href))
      window.open("new-options.html", "_blank");

    if (callback)
      callback();
  };

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
}());
