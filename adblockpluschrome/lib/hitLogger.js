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

/** @module hitLogger */

import * as ewe from "../../vendor/webext-sdk/dist/ewe-api.js";

let requestMethods = new Set([
  "allowing",
  "header",
  "request"
]);

export function getTarget({filter, matchInfo, request})
{
  let isFrame = !requestMethods.has(matchInfo.method);

  let type;
  if (matchInfo.method == "request")
    type = ewe.reporting.contentTypesMap.get(request.type);
  else if (matchInfo.method == "allowing")
    type = matchInfo.allowingReason;
  // Show matching method when it had an effect on the request
  else if (filter)
    type = matchInfo.method;
  else
    type = ewe.reporting.contentTypesMap.get(request.type);

  if (!type)
    type = "other";

  return {
    docDomain: matchInfo.docDomain,
    isFrame,
    rewrittenUrl: matchInfo.rewrittenUrl,
    type: type.toUpperCase(),
    url: request.url
  };
}
