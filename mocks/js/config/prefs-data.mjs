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

import {params} from "./env.mjs";
import {subscriptionUrls} from "./subscriptions.mjs";

const prefsData = {
  additional_subscriptions: params.additionalSubscriptions.split(","),
  elemhide_debug: false,
  notifications_ignoredcategories: [],
  premium_manage_page_url: "https://accounts.adblockplus.org/manage",
  premium_upgrade_page_url: "https://accounts.adblockplus.org/upgrade",
  recommend_language_subscriptions: false,
  shouldShowBlockElementMenu: true,
  show_devtools_panel: true,
  show_statsinicon: true,
  subscriptions_exceptionsurl: subscriptionUrls.URL_ALLOWLIST,
  subscriptions_exceptionsurl_privacy: subscriptionUrls.URL_ALLOWLIST_PRIVACY,
  ui_warn_tracking: true,
  data_collection_opt_out: false
};

export default prefsData;
