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

import {params} from "../config/env";
import filterState from "./filter-state";

export class Filter
{
  static fromText(text)
  {
    const {filterError, filterOption} = params;
    if (filterError)
      return new InvalidFilter(text, `filter_${filterError}`, filterOption);

    if (text[0] === "!")
      return new CommentFilter(text);

    return new URLFilter(text);
  }

  static normalize(text)
  {
    return text;
  }

  constructor(text)
  {
    this.text = text;
  }
}

export class ActiveFilter extends Filter
{
  constructor(text)
  {
    super(text);
    this.disabled = false;
  }
  get disabled()
  {
    return !filterState.isEnabled(this.text);
  }
  set disabled(value)
  {
    filterState.setEnabled(this.text, !value);
  }
}

class CommentFilter extends Filter {}

export class InvalidFilter extends Filter
{
  constructor(text, reason, option)
  {
    super(text);
    this.reason = reason;
    this.option = option;
  }
}

export class URLFilter extends ActiveFilter {}
