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

const criticalNotificationScript = `
  dispatchEvent(new CustomEvent("extension:notification", {
    detail: {
      type: "critical",
      links: ["adblock_plus"],
      texts: {
        title: "This is a critical notification",
        message: "This is a message without a link.",
      }
    }
  }));
`;

const defaultNotificationScript = `
  dispatchEvent(new CustomEvent("extension:notification", {
    detail: {
      type: "default",
      links: ["adblock_plus"],
      texts: {
        title: "This is default notification",
        message: "This is a message with a <a>LINK</a> to abp.org page.",
      }
    }
  }));
`;

const informationNotificationScript = `
  dispatchEvent(new CustomEvent("extension:notification", {
    detail: {
      type: "information",
      texts: {
        title: "This is information notification",
        message: "This is a message without a link",
      }
    }
  }));
`;

const notificationScripts = {
  criticalNotification: criticalNotificationScript,
  informationNotification: informationNotificationScript,
  defaultNotification: defaultNotificationScript
};

exports.notificationScripts = notificationScripts;
