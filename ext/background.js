/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-2016 Eyeo GmbH
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

(function(global)
{
  if (!global.ext)
    global.ext = {};

  window.addEventListener("load", function()
  {
    parent.postMessage({
      type: "backgroundPageLoaded"
    }, "*");
  }, false)

  function PageMap()
  {
    this._keys = [];
    this._values = [];
  }
  PageMap.prototype = {
    keys: function()
    {
      return this._keys.map(function(source)
      {
        return new global.ext.Page(source);
      });
    },

    get: function(page)
    {
      return this._values[this._keys.indexOf(page._source)];
    },

    set: function(page, value)
    {
      var index = this._keys.indexOf(page._source);
      if (index < 0)
      {
        index = this._keys.push(page._source) - 1;

        var callback = function()
        {
          page._source.removeEventListener("unload", callback, false);
          this.delete(page);
        }.bind(this);
        page._source.addEventListener("unload", callback, false);
      }
      this._values[index] = value;
    },

    delete: function(page)
    {
      var index = this._keys.indexOf(page._source);
      if (index >= 0)
      {
        this._keys.splice(index, 1);
        this._values.splice(index, 1);
      }
    }
  };

  global.ext.PageMap = PageMap;

  global.ext.showOptions = function(callback)
  {
    if (top.location.href.indexOf("options.html") == -1)
      window.open("options.html", "_blank");

    if (callback)
      callback();
  };

  global.ext.devtools = {
    onCreated: {
      addListener: function(listener)
      {
        window.addEventListener("message", function(event)
        {
          if (event.data.type == "devtools")
            listener(new ext.Page(event.source));
        });
      }
    }
  };
})(this);
