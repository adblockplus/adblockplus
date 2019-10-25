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

const URL_SUBSCRIPTION_BASE = "https://easylist-downloads.adblockplus.org";
const URL_BLACKLIST = `${URL_SUBSCRIPTION_BASE}/easylistgermany+easylist.txt`;
const URL_WHITELIST = `${URL_SUBSCRIPTION_BASE}/exceptionrules.txt`;
const URL_WHITELIST_PRIVACY =
  `${URL_SUBSCRIPTION_BASE}/exceptionrules-privacy-friendly.txt`;
const URL_DOCLINK_BASE = "https://adblockplus.org/redirect?link=";

const USER_ID = "~user~786254";

const subscriptionDetails = {
  [URL_BLACKLIST]: {
    title: "EasyList Germany+EasyList",
    filterText: ["-ad-banner.", "-ad-big.", "-ad-bottom-", "-ad-button-"],
    installed: true
  },
  [URL_WHITELIST]: {
    title: "Allow non-intrusive advertising",
    installed: true
  },
  [URL_WHITELIST_PRIVACY]: {
    title: "Allow only nonintrusive ads that are privacy-friendly"
  },
  [`${URL_SUBSCRIPTION_BASE}/fanboy-social.txt`]: {
    title: "Fanboy's Social Blocking List",
    installed: true
  },
  [`${URL_SUBSCRIPTION_BASE}/abp-filters-anti-cv.txt`]: {
    title: "ABP Anti-Circumvention list",
    installed: true,
    disabled: false,
    recommended: "circumvention"
  },
  [`${URL_SUBSCRIPTION_BASE}/antiadblockfilters.txt`]: {
    title: "Adblock Warning Removal List",
    installed: true,
    disabled: true
  },
  [USER_ID]: {
    installed: true
  }
};

module.exports = {
  subscriptionUrls: {
    URL_DOCLINK_BASE,
    URL_WHITELIST,
    URL_WHITELIST_PRIVACY
  },
  subscriptionDetails,
  USER_ID
};
