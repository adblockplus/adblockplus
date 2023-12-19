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

import * as ewe from "@eyeo/webext-ad-filtering-solution";

const requestMethods = new Set([
  "allowing",
  "header",
  "request"
]);

export function toPlainBlockableItem({filter, matchInfo, request})
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

export function toPlainFilter(filter)
{
  let obj = toPlainObject(
    ["csp", "enabled", "selector", "slow", "text", "type"],
    filter
  );

  // For the time being, we are renaming the enabled property to
  // make the UI compatible with EWE without having to rename it
  // in the UI code itself just yet
  // For the same reason, we're not adding the property for comment filters
  if (obj.enabled !== null)
    obj.disabled = !obj.enabled;
  delete obj.enabled;

  return obj;
}

export let toPlainFilterError = toPlainObject.bind(null, [
  "lineno", "option", "reason", "type"
]);

function toPlainObject(keys, obj)
{
  let result = {};
  for (let key of keys)
  {
    if (key in obj)
      result[key] = obj[key];
  }
  return result;
}

export let toPlainRecommendation = toPlainObject.bind(null, [
  "languages", "title", "type", "url"
]);

export function toPlainSubscription(subscription)
{
  let obj = toPlainObject(
    [
      "downloadable", "downloadStatus", "enabled", "homepage", "version",
      "lastDownload", "lastSuccess", "softExpiration", "expires", "title",
      "url", "downloading"
    ],
    subscription
  );

  // For the time being, we are renaming the enabled property to
  // make the UI compatible with EWE without having to rename it
  // in the UI code itself just yet
  obj.disabled = !obj.enabled;
  delete obj.enabled;

  return obj;
}
