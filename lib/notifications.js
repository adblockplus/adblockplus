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

const {notifications} = require("notifications");
const {Prefs} = require("prefs");

const DELAY_IN_MS = 30 * 60 * 1000;
const MIN_BLOCKED = 55;

function getApplication()
{
  // We're resolving the application name asynchronously on Gecko so we can't
  // require the info module up front.
  const {application} = require("info");
  return application;
}

exports.initDay1Notification = function initDay1Notification()
{
  const application = getApplication();
  if (application == "fennec" || Prefs.suppress_first_run_page)
    return;

  setTimeout(() =>
  {
    // We don't know what exactly the blocked count will be when
    // the notification will be shown but we expect it to be shown
    // immediately after it surpasses the threshold
    let blockedCount = Prefs.blocked_total;
    if (blockedCount < MIN_BLOCKED)
    {
      blockedCount = MIN_BLOCKED;
    }

    const notification = {
      id: "day1",
      type: "normal",
      title: browser.i18n.getMessage("notification_day1_title", [blockedCount]),
      message: browser.i18n.getMessage("notification_day1_message"),
      links: ["abp:day1"],
      targets: [
        {blockedTotalMin: MIN_BLOCKED}
      ]
    };

    notifications.addNotification(notification);
    notifications.showNext();
  }, DELAY_IN_MS);
};
