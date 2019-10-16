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

const metaModule = require("module");
const path = require("path");

const origGlobals = new Map();
const origModules = new Map();
const origOverrides = new Set();
const origRequire = metaModule.prototype.require;

class TestEnvironment
{
  constructor(config)
  {
    this._globals = config.globals;
    this._modules = config.modules;

    this.setGlobals(config.globals);
    this.setModules(config.modules);
  }

  get globals()
  {
    return this._globals;
  }

  get modules()
  {
    return this._modules;
  }

  override(parent, name, override)
  {
    origOverrides.add({parent, name, original: parent[name]});
    parent[name] = override;
  }

  requireModule(modulePath)
  {
    for (const key of Object.keys(require.cache))
    {
      delete require.cache[key];
    }

    modulePath = path.join("tests", modulePath);
    return origRequire.call(this, require.resolve(modulePath));
  }

  _restoreGlobals()
  {
    for (const name of origGlobals.keys())
    {
      global[name] = origGlobals.get(name);
    }
    origGlobals.clear();
  }

  _restoreModules()
  {
    metaModule.prototype.require = origRequire;
    origModules.clear();
  }

  _restoreOverrides()
  {
    for (const {parent, name, original} of origOverrides)
    {
      parent[name] = original;
    }
    origOverrides.clear();
  }

  restore()
  {
    this._restoreGlobals();
    this._restoreModules();
    this._restoreOverrides();
  }

  setGlobals(overrides)
  {
    for (const name in overrides)
    {
      origGlobals.set(name, global[name]);
      global[name] = overrides[name];
    }
  }

  setModules(overrides)
  {
    metaModule.prototype.require =
      (name) => overrides[name] || this._modules[name];
  }
}
exports.TestEnvironment = TestEnvironment;
