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

const {params} = require("./env");
const {subscriptionUrls} = require("./subscriptions");

const prefsData = {
  notifications_ignoredcategories: [],
  shouldShowBlockElementMenu: true,
  show_devtools_panel: true,
  show_statsinicon: true,
  ui_warn_tracking: true,
  additional_subscriptions: params.additionalSubscriptions.split(","),
  subscriptions_exceptionsurl: subscriptionUrls.URL_WHITELIST,
  subscriptions_exceptionsurl_privacy:
    subscriptionUrls.URL_WHITELIST_PRIVACY
};

module.exports = prefsData;
