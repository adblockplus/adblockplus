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

const customErrors = [
  {
    testName: "Invalid filter option",
    customFilter: "$unknown",
    errorText: "Invalid filter option"
  },
  {
    testName: "No active domain for snippets",
    customFilter: "#$#noactivedomain",
    errorText: "No active domain specified. Please specify at " +
    "least one domain for this snippet filter."
  },
  {
    testName: "Filter list header",
    customFilter: "[header]",
    errorText: "Filter list headers are only supported in " +
    "downloadable filter lists."
  },
  {
    testName: "CSP",
    customFilter: " test.com$csp=base-uri",
    errorText: "Invalid content security policy (syntax does " +
    "not adhere to standard)."
  },
  {
    testName: "Invalid regex",
    customFilter: " /[/",
    errorText: "Invalid regular expression (syntax does not adhere " +
    "to standard)."
  },
  {
    testName: "Empty domain",
    customFilter: " ,##emptydomain",
    errorText: "Invalid or empty domain. Domain list must contain one " +
    "or more domains separated by a comma (,), e.g. abc.com,def.com,ghi.com."
  }
];

const multipleFilters = `
  ##.hiding_filter
  /blocking/filter/*
  duplicate
  ! comment
`;

exports.customErrors = customErrors;
exports.multipleFilters = multipleFilters;
