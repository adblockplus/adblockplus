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

exports.suites = {
  all: ["./tests/**.js"],
  e2e: [
    "./tests/test-abp-premium-*.js",
    "./tests/test-advanced-tab-custom-filters.js",
    "./tests/test-advanced-tab-customisations.js",
    "./tests/test-advanced-tab-filter-lists.js",
    "./tests/test-allowlisted-websites-tab.js",
    "./tests/test-client-side-notifications-appearance.js",
    "./tests/test-filter-list-suggestion.js",
    "./tests/test-issue-reporter.js",
    "./tests/test-options-page-acceptable-ads.js",
    "./tests/test-options-page-dialog-links.js",
    "./tests/test-options-page-dialogs.js",
    "./tests/test-options-page-language.js",
    "./tests/test-options-page-links.js",
    "./tests/test-options-page-recommended-filters.js",
    "./tests/test-options-page-tooltips.js",
    "./tests/test-options-page-tracking-warning.js",
    "./tests/test-page-links.js"
  ],
  filterlists: [
    "./tests/test-advanced-tab-filter-lists.js",
    "./tests/test-built-in-filter-list-dropdown.js",
    "./tests/test-smoke-main.js",
    "./tests/test-options-page-acceptable-ads.js"
  ],
  integration: ["./tests/test-integration-*.js"],
  oldbrowsers: [
    "./tests/test-abp-premium-cookiefl-premium-users.js",
    "./tests/test-abp-premium-dcfl-premium-users.js",
    "./tests/test-abp-premium-downgrade.js",
    "./tests/test-abp-premium-get-started.js",
    "./tests/test-abp-premium-links-for-free-users.js",
    "./tests/test-abp-premium-links-for-premium-users.js",
    "./tests/test-abp-premium-onboarding-free-user.js",
    "./tests/test-abp-premium-onboarding-premium-user.js",
    "./tests/test-abp-premium-one-click-allow.js",
    "./tests/test-abp-premium-ui.js",
    "./tests/test-advanced-tab-customisations.js",
    "./tests/test-advanced-tab-filter-lists.js",
    "./tests/test-allowlisted-websites-tab.js",
    "./tests/test-built-in-filter-list-dropdown.js",
    "./tests/test-integration-subscriptions.js",
    "./tests/test-one-click-allow.js",
    "./tests/test-options-page-language.js",
    "./tests/test-options-page-recommended-filters.js",
    "./tests/test-smoke-*.js"
  ],
  smoke: ["./tests/test-smoke-*.js"]
};
