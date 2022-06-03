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

import {Filter} from "./filter-classes";
import filterNotifier from "./filter-notifier";
import {knownFilterText} from "../config/filters";
import {params} from "../config/env";
import {subscriptionDetails} from "../config/subscriptions";

export function Subscription(url)
{
  this.url = url;
  this._disabled = false;
  this._lastDownload = 1234;
  this._filterText = [];
  this.hasDisabledFilters = false;
  this.homepage = "https://easylist.adblockplus.org/";
  this.downloadStatus = params.downloadStatus;

  const details = subscriptionDetails[this.url];
  if (details)
  {
    this._disabled = !!details.disabled;
    this.title = details.title || "";
    if (details.filterText)
    {
      this._filterText = details.filterText.slice();
    }
  }
  Subscription.knownSubscriptions.set(url, this);

  if (params.filtersDisabled && this._filterText.length)
    this.hasDisabledFilters = true;
}
Subscription.prototype =
{
  get disabled()
  {
    return this._disabled;
  },
  set disabled(value)
  {
    this._disabled = value;
    filterNotifier.emit("subscription.disabled", this);
  },
  get lastDownload()
  {
    return this._lastDownload;
  },
  set lastDownload(value)
  {
    this._lastDownload = value;
    filterNotifier.emit("subscription.lastDownload", this);
  },
  get filterCount()
  {
    return this._filterText.length;
  },
  *filterText()
  {
    yield* this._filterText;
  }
};
Subscription.knownSubscriptions = new Map();
Subscription.fromURL = function(url)
{
  const subscription = Subscription.knownSubscriptions.get(url);
  if (subscription)
    return subscription;
  if (/^https?:\/\//.test(url))
    return new Subscription(url);
  return new SpecialSubscription(url);
};

export function SpecialSubscription(url)
{
  this.url = url;
  this.disabled = false;
  this._filterText = knownFilterText.slice();
  Subscription.knownSubscriptions.set(url, this);
}

SpecialSubscription.prototype = {
  get filterCount()
  {
    return this._filterText.length;
  },
  *filterText()
  {
    yield* this._filterText;
  },
  addFilterText(filterText)
  {
    this._filterText.push(filterText);
  },
  filterTextAt(idx)
  {
    return this._filterText[idx];
  },
  removeFilter(filterText)
  {
    for (let i = 0; i < this._filterText.length; i++)
    {
      if (this._filterText[i] == filterText)
      {
        this._filterText.splice(i, 1);
        filterNotifier.emit(
          "filter.removed",
          Filter.fromText(filterText)
        );
        return;
      }
    }
  }
};

export const DownloadableSubscription = Subscription;
