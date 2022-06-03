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

export function EventEmitter()
{
  this._listeners = Object.create(null);
}
EventEmitter.prototype = {
  on(name, listener)
  {
    if (name in this._listeners)
      this._listeners[name].push(listener);
    else
      this._listeners[name] = [listener];
  },
  off(name, listener)
  {
    const listeners = this._listeners[name];
    if (listeners)
    {
      const idx = listeners.indexOf(listener);
      if (idx != -1)
        listeners.splice(idx, 1);
    }
  },
  emit(name, ...args)
  {
    const listeners = this._listeners[name];
    if (listeners)
    {
      for (const listener of listeners)
        listener(...args);
    }
  }
};
