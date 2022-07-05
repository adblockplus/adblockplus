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

let records = [];

function add(target, filter, subscriptions)
{
  const changes = [];
  const newRecord = {
    filter: getFilterInfo(filter, subscriptions),
    target
  };

  let matchesAny = false;

  for (let i = 0; i < records.length; i++)
  {
    const oldRecord = records[i];

    const matches = hasRecord(newRecord, oldRecord);
    if (!matches)
      continue;

    matchesAny = true;

    // Update record without filters, if filter matches on later checks
    if (!filter)
      break;

    if (oldRecord.filter)
      continue;

    oldRecord.filter = filter;

    changes.push({
      filter: oldRecord.filter,
      index: i,
      initialize: true,
      request: oldRecord.target,
      type: "update"
    });
  }

  if (!matchesAny)
  {
    changes.push({
      filter: newRecord.filter,
      request: newRecord.target,
      type: "add"
    });

    records.push(newRecord);
  }

  return changes;
}

function clear()
{
  records = [];
}

function getFilterInfo(filter, subscriptions)
{
  if (!filter)
    return null;

  let userDefined = false;
  let subscriptionTitle = null;

  for (const subscription of subscriptions)
  {
    if (!subscription.downloadable)
    {
      userDefined = true;
      break;
    }

    subscriptionTitle = subscription.title;
    if (subscriptionTitle)
      break;
  }

  return {
    allowlisted: filter.type == "allowing" ||
      filter.type == "elemhideexception",
    subscription: subscriptionTitle,
    text: filter.text,
    userDefined
  };
}

function hasRecord(newRecord, oldRecord)
{
  if (oldRecord.target.url !== newRecord.target.url)
    return false;

  if (oldRecord.target.docDomain !== newRecord.target.docDomain)
    return false;

  // Ignore frame content allowlisting if there is already
  // a DOCUMENT exception which disables all means of blocking.
  if (oldRecord.target.type == "DOCUMENT")
  {
    if (!newRecord.target.isFrame)
      return false;
  }
  else if (oldRecord.target.type !== newRecord.target.type)
  {
    return false;
  }

  // Matched element hiding filters don't relate to a particular request,
  // so we have to compare the selector in order to avoid duplicates.
  if (oldRecord.filter && newRecord.filter)
  {
    if (oldRecord.filter.selector != newRecord.filter.selector)
      return false;
  }

  // We apply multiple CSP filters to a document, but we must still remove
  // any duplicates. Two CSP filters are duplicates if both have identical
  // text.
  if (oldRecord.filter && oldRecord.filter.csp &&
      newRecord.filter && newRecord.filter.csp)
  {
    if (oldRecord.filter.text !== newRecord.filter.text)
      return false;
  }

  return true;
}

const recordManager = {
  add,
  clear
};

export default recordManager;
