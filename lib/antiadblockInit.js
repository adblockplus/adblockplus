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

const {Prefs} = require("prefs");
const {ActiveFilter} = require("filterClasses");
const {FilterStorage} = require("filterStorage");
const {FilterNotifier} = require("filterNotifier");
const {Subscription} = require("subscriptionClasses");
const {Notification} = require("notification");

let ext;
if (typeof window != "undefined" && window.ext)
  ({ext} = window);
else
  ext = require("ext_background");

exports.initAntiAdblockNotification = function initAntiAdblockNotification()
{
  let notification = {
    id: "antiadblock",
    type: "question",
    title: ext.i18n.getMessage("notification_antiadblock_title"),
    message: ext.i18n.getMessage("notification_antiadblock_message"),
    urlFilters: []
  };

  function notificationListener(approved)
  {
    let subscription = Subscription.fromURL(Prefs.subscriptions_antiadblockurl);
    if (subscription.url in FilterStorage.knownSubscriptions)
      subscription.disabled = !approved;
  }

  function addAntiAdblockNotification(subscription)
  {
    let urlFilters = [];
    for (let filter of subscription.filters)
    {
      if (filter instanceof ActiveFilter)
      {
        for (let domain in filter.domains)
        {
          let urlFilter = "||" + domain + "^$document";
          if (domain && filter.domains[domain] &&
              urlFilters.indexOf(urlFilter) == -1)
            urlFilters.push(urlFilter);
        }
      }
    }
    notification.urlFilters = urlFilters;
    Notification.addNotification(notification);
    Notification.addQuestionListener(notification.id, notificationListener);
  }

  function removeAntiAdblockNotification()
  {
    Notification.removeNotification(notification);
    Notification.removeQuestionListener(notification.id, notificationListener);
  }

  let antiAdblockSubscription = Subscription.fromURL(
    Prefs.subscriptions_antiadblockurl
  );
  if (antiAdblockSubscription.lastDownload && antiAdblockSubscription.disabled)
    addAntiAdblockNotification(antiAdblockSubscription);

  function onSubscriptionChange(subscription)
  {
    let url = Prefs.subscriptions_antiadblockurl;
    if (url != subscription.url)
      return;

    if (url in FilterStorage.knownSubscriptions && subscription.disabled)
      addAntiAdblockNotification(subscription);
    else
      removeAntiAdblockNotification();
  }

  FilterNotifier.on("subscription.updated", onSubscriptionChange);
  FilterNotifier.on("subscription.removed", onSubscriptionChange);
  FilterNotifier.on("subscription.disabled", onSubscriptionChange);
};
