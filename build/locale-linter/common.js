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

// Chrome: Only ASCII [a-z], [A-Z], [0-9] and "_" are allowed.
// https://developer.chrome.com/apps/i18n-messages#name
// https://developer.chrome.com/apps/i18n-messages#placeholders
// We're further restricting the string ID format to enforce
// our naming convention.
exports.reStringId = /^[a-zA-Z][a-zA-Z0-9_]+$/;

class ResultGroup
{
  constructor(message)
  {
    this._errorCount = 0;
    this._results = [];
    this.message = message;
  }

  getStack(indent = 1)
  {
    const lines = [];
    for (const result of this._results)
    {
      if (!(result instanceof ResultGroup) || result.hasErrors())
      {
        let {message} = result;
        if (!(result instanceof ResultGroup))
        {
          message = `[Error]: ${message}`;
        }
        lines.push(`${"  ".repeat(indent)}${message}`);

        if (result instanceof ResultGroup)
        {
          lines.push(...result.getStack(indent + 1));
        }
      }
    }
    return lines;
  }

  hasErrors()
  {
    return this._errorCount > 0;
  }

  push(result)
  {
    if (typeof result === "string")
    {
      result = new Error(result);
    }
    this._results.push(result);

    if (result instanceof ResultGroup && !result.hasErrors())
      return;

    this._errorCount++;
  }

  toString()
  {
    const prefix = (this.hasErrors()) ? "Fail" : "Success";
    return [
      `[${prefix}]: ${this.message}`,
      ...this.getStack()
    ].join("\n");
  }
}
exports.ResultGroup = ResultGroup;
