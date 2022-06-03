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

import filterNotifier from "./filter-notifier";
import {Subscription} from "./subscription-classes";
import {subscriptionDetails, USER_ID} from "../config/subscriptions";

const knownSubscriptions = new Map();
for (const url in subscriptionDetails)
{
  if (!subscriptionDetails[url].installed)
    continue;

  knownSubscriptions.set(
    url,
    Subscription.fromURL(url)
  );
}

const customSubscription = knownSubscriptions.get(USER_ID);

const filterStorage = {
  *subscriptions()
  {
    yield* this.knownSubscriptions.values();
  },

  get knownSubscriptions()
  {
    return knownSubscriptions;
  },

  addSubscription(subscription)
  {
    const {fromURL} = Subscription;

    if (!knownSubscriptions.has(subscription.url))
    {
      knownSubscriptions.set(subscription.url, fromURL(subscription.url));
      filterNotifier.emit("subscription.added", subscription);
    }
  },

  removeSubscription(subscription)
  {
    if (knownSubscriptions.has(subscription.url))
    {
      knownSubscriptions.delete(subscription.url);
      filterNotifier.emit("subscription.removed", subscription);
    }
  },

  addFilter(filter)
  {
    for (const text of customSubscription.filterText())
    {
      if (text == filter.text)
        return;
    }
    customSubscription.addFilterText(filter.text);
    filterNotifier.emit("filter.added", filter);
  },

  removeFilter(filter)
  {
    customSubscription.removeFilter(filter.text);
  }
};

export default filterStorage;
