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

const notifications = {
  critical: {
    type: "critical",
    title: "Critical title",
    message: "Critical <a>message</a> with <a>links</a>",
    links: ["foo", "bar"]
  },
  default: {
    title: "Default title",
    message: "Default <a>message</a> with <a>links</a>",
    links: ["foo", "bar"]
  },
  information: {
    type: "information",
    title: "Info title",
    message: "Info <a>message</a> with <a>links</a>",
    links: ["foo", "bar"]
  }
};

export function getActiveNotification()
{
  const name = params.notification;
  if (!name || !(name in notifications))
    return null;

  return notifications[name];
}

export function notificationClicked()
{
}

export function shouldDisplay()
{
  return true;
}
