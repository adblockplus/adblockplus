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

import {showOptions} from "../../lib/pages/options.js";
import {installHandler} from "./messaging/events.js";
import {port} from "./messaging/port.js";
import {
  toSerializableFilter,
  toSerializableFilterError,
  toSerializableRecommendation,
  toSerializableSubscription
} from "../../src/core/api/background";
import {EventEmitter} from "./events.js";
import {filterTypes} from "./requestBlocker.js";

const disabledFilterCounters = new Map();
const eventEmitter = new EventEmitter();

export async function addFilter(filterText, origin)
{
  const data = {created: Date.now()};
  if (origin)
    data.origin = origin;

  try
  {
    await ewe.filters.add([filterText], data);
    await ewe.filters.enable([filterText]);
  }
  catch (ex)
  {
    // If we add an existing filter again, we ignore the resulting error to
    // avoid showing unnecessary error messages to the user
    if (ex.type !== "storage_duplicate_filters")
      return ex;
  }

  return null;
}

export async function addSubscription(details)
{
  try
  {
    await ewe.subscriptions.add(details.url, details);
    await ewe.subscriptions.sync(details.url);
  }
  catch (ex)
  {
    return false;
  }

  return true;
}

/**
 * Asks user to confirm the subscription details before it is added.
 * @param {Object} details
 */
export async function askConfirmSubscription(details)
{
  await showOptions({
    type: "app.respond",
    action: "addSubscription",
    args: [{
      homepage: details.homepage || null,
      title: details.title || null,
      url: details.url
    }]
  });
}

function parseFilter(text)
{
  let filterText = text.trim() || null;
  let error = null;

  if (filterText)
  {
    if (filterText[0] == "[")
    {
      error = {type: "unexpected_filter_list_header"};
    }
    else
    {
      let filterError = ewe.filters.validate(filterText);
      if (filterError)
        error = toSerializableFilterError(filterError);
    }
  }

  return [filterText, error];
}

async function filtersAdd(text, origin)
{
  let [filterText, error] = parseFilter(text);

  if (!error && filterText)
    error = await addFilter(filterText, origin);

  return (error) ? [error] : [];
}

function filtersValidate(text)
{
  let filterTexts = [];
  let errors = [];

  let lines = text.split("\n");
  for (let i = 0; i < lines.length; i++)
  {
    let [filterText, error] = parseFilter(lines[i]);

    if (error)
    {
      // We don't treat filter headers like invalid filters,
      // instead we simply ignore them and don't show any errors
      // in order to allow pasting complete filter lists.
      // If there are no filters, we do treat it as an invalid filter
      // to inform users about it and to give them a chance to edit it.
      if (error.type === "unexpected_filter_list_header" &&
          lines.length > 1)
        continue;

      if (lines.length > 1)
        error.lineno = i + 1;

      errors.push(error);
    }
    else if (filterText)
    {
      filterTexts.push(filterText);
    }
  }

  return [filterTexts, errors];
}

async function filtersRemove(message)
{
  await ewe.filters.remove([message.text]);
  // in order to behave, from consumer perspective, like any other
  // method that could produce errors, return an Array, even if empty
  return [];
}

export async function initDisabledFilterCounters()
{
  for (const subscription of await ewe.subscriptions.getSubscriptions())
  {
    let count = 0;

    for (const filter of await ewe.subscriptions.getFilters(subscription.url))
    {
      if (filter.enabled === false)
        count++;
    }

    if (count > 0)
    {
      disabledFilterCounters.set(subscription.url, count);
      // Core doesn't expose the subscription's disabled filters state
      // and to avoid adding new "loaded" events and behavior around it,
      // we emit a "filtersDisabled" event to trigger UI changes
      eventEmitter.emit(
        "filtersDisabled",
        subscription,
        true,
        true
      );
    }
  }
}

async function updateCounters(filterText, enabled)
{
  for (const subscription of await ewe.subscriptions.getForFilter(filterText))
  {
    const oldCount = disabledFilterCounters.get(subscription.url) || 0;
    const newCount = (enabled) ? oldCount - 1 : oldCount + 1;

    if (newCount === 0)
      disabledFilterCounters.delete(subscription.url);
    else
      disabledFilterCounters.set(subscription.url, newCount);

    if (oldCount === 0 || newCount === 0)
    {
      eventEmitter.emit(
        "filtersDisabled",
        subscription,
        newCount > 0,
        oldCount > 0
      );
    }
  }
}


export function start()
{
  /**
   * Attempts to add the given filter, or returns an error.
   *
   * @event "filters.add"
   * @property {string} [origin] - Where the filter originated from
   * @property {string} text - The filter text to add
   * @returns {FilterError[]}
   */
  port.on("filters.add", (message, sender) =>
  {
    return filtersAdd(message.text, message.origin);
  });

  /**
   * Returns a serialized version of all filters in special subscriptions.
   *
   * @event "filters.get"
   * @returns {object[]}
   */
  port.on("filters.get", async(message, sender) =>
  {
    let filters = await ewe.filters.getUserFilters();
    return filters.map(toSerializableFilter);
  });

  /**
   * Returns the available filter types, e.g. "FONT", "WEBSOCKET", etc.
   *
   * @event "filters.getTypes"
   * @returns {string[]}
   */
  port.on("filters.getTypes", (message, sender) => Array.from(filterTypes));

  /**
   * Import the given block of filter text as custom user filters.
   *
   * @event "filters.importRaw"
   * @property {string} [origin]
   *   Where the filter originated from.
   * @property {string} text
   *   The filters to add.
   * @returns {string[]} errors
   */
  port.on("filters.importRaw", async(message, sender) =>
  {
    let [filterTexts, errors] = filtersValidate(message.text);

    if (errors.length == 0)
    {
      for (const filterText of filterTexts)
      {
        const error = await addFilter(filterText, message.origin);
        if (error)
          errors.push(error);
      }
    }

    return errors;
  });

  /**
   * Remove the given filter.
   *
   * @event "filters.remove"
   * @property {string} text
   *   The text of the filter to remove.
   * @property {string} [subscriptionUrl]
   *   The URL of the subscription to remove the filter from, defaults to all
   *   subscriptions.
   * @property {number} [index]
   *   The index of the filter in the given subscription to remove, defaults to
   *   all instances and ignored if subscriptionUrl isn't given.
   * @returns {string[]} errors
   */
  port.on("filters.remove", (message, sender) => filtersRemove(message));

  /**
   * Replaces one custom user filter with another.
   *
   * @event "filters.replace"
   * @property {string} new - The new filter text to add.
   * @property {string} old - The old filter text to remove.
   * @property {string} [origin] - Where the filter originated from.
   * @returns {string[]} errors
   */
  port.on("filters.replace", async(message, sender) =>
  {
    let errors = await filtersAdd(message.new, message.origin);
    if (errors.length)
      return errors;
    await filtersRemove({text: message.old});
    return [];
  });

  /**
   * Enabled or disables the given filter.
   *
   * @event "filters.toggle"
   * @property {string} text - The filter text.
   * @property {boolean} disabled - True to disable the filter, false to enable.
   */
  port.on("filters.toggle", async(message, sender) =>
  {
    if (message.disabled)
      await ewe.filters.disable([message.text]);
    else
      await ewe.filters.enable([message.text]);
  });

  /**
   * Validates the filters inside the given block of filter text.
   *
   * @event "filters.validate"
   * @property {string} text - The filters to validate
   * @returns {string[]} errors
   */
  port.on("filters.validate", (message, sender) =>
  {
    let [, errors] = filtersValidate(message.text);
    return errors;
  });

  /**
   * Adds a subscription, either in the background or with the user's
   * confirmation.
   *
   * @event "subscriptions.add"
   * @property {string} url
   *   The subscription's URL.
   * @property {boolean} confirm
   *   If true the user will first be asked to confirm the subscription's
   *   details before it is added.
   * @property {string} [title]
   *   The subscription's title.
   * @property {string} [homepage]
   *   The subscription's homepage.
   * @returns {?boolean}
   *   true if the subscription was added, false if the URL is invalid,
   *   null if the "confirm" property was set
   */
  port.on("subscriptions.add", async(message, sender) =>
  {
    if (message.confirm)
    {
      askConfirmSubscription({
        homepage: message.homepage,
        title: message.title,
        url: message.url
      });
      return null;
    }

    return addSubscription(message);
  });

  ewe.reporting.onSubscribeLinkClicked.addListener(message =>
  {
    askConfirmSubscription({
      title: message.title,
      url: message.url
    });
  });

  /**
   * Enables all filters from the given subscription.
   *
   * @event "subscriptions.enableAllFilters"
   * @property {string} url
   *   The subscription's URL.
   */
  port.on("subscriptions.enableAllFilters", async(message, sender) =>
  {
    const filters = await ewe.subscriptions.getFilters(message.url);
    const filterTexts = filters.map(filter => filter.text);
    await ewe.filters.enable(filterTexts);
  });

  /**
   * Returns a serialized version of all updatable subscriptions which meet
   * the given criteria. Optionally include the disabled filters for those
   * subscriptions.
   *
   * @event "subscriptions.get"
   * @property {boolean} ignoreDisabled
   *   Skip disabled subscriptions if true.
   * @property {boolean} disabledFilters
   *   Include a subscription's disabled filters if true.
   * @returns {object[]} subscriptions
   */
  port.on("subscriptions.get", async(message, sender) =>
  {
    let subscriptions = [];
    for (let s of await ewe.subscriptions.getSubscriptions())
    {
      if (message.ignoreDisabled && !s.enabled)
        continue;

      let subscription = toSerializableSubscription(s);
      if (message.disabledFilters)
      {
        let filters = await ewe.subscriptions.getFilters(s.url) || [];
        subscription.disabledFilters = filters
        .filter(f => f.enabled === false)
        .map(f => f.text);
      }
      subscriptions.push(subscription);
    }
    return subscriptions;
  });

  /**
   * Returns the amount of disabled filters contained in a subscription.
   *
   * @event "subscriptions.getDisabledFilterCount"
   * @property {string} url - The subscription's URL.
   */
  port.on("subscriptions.getDisabledFilterCount", (message, sender) =>
  {
    return disabledFilterCounters.get(message.url) || 0;
  });

  /**
   * Returns a list of serialised recommended subscriptions for the user.
   *
   * @event "subscriptions.getRecommendations"
   * @returns {object[]} recommendedSubscriptions
   */
  port.on("subscriptions.getRecommendations", async(message, sender) =>
  {
    const recommendations = await ewe.subscriptions.getRecommendations();
    return Array.from(recommendations, toSerializableRecommendation);
  });

  /**
   * Remove the given subscription if it exists.
   *
   * @event "subscriptions.remove"
   * @property {string} url - The subscription's URL.
   */
  port.on("subscriptions.remove", async(message, sender) =>
  {
    await ewe.subscriptions.remove(message.url);
  });

  /**
   * Toggles a subscription by either enabling/disabling, or by adding/removing
   * it.
   *
   * @event "subscriptions.toggle"
   * @property {string} url
   *   The subscription's URL.
   * @property {boolean} keepInstalled
   *   If true enable/disable the subscription, otherwise add/remove.
   * @returns {boolean}
   *   true if the subscription was toggled successfully,
   *   false if it's a new subscription with an invalid URL
   */
  port.on("subscriptions.toggle", async(message, sender) =>
  {
    if (await ewe.subscriptions.has(message.url))
    {
      let subscription;
      for (let s of await ewe.subscriptions.getSubscriptions())
      {
        if (s.url == message.url)
        {
          subscription = s;
          break;
        }
      }

      if (subscription)
      {
        if (!subscription.enabled || message.keepInstalled)
        {
          if (subscription.enabled)
            await ewe.subscriptions.disable(message.url);
          else
            await ewe.subscriptions.enable(message.url);
        }
        else
        {
          await ewe.subscriptions.remove(subscription.url);
        }
        return true;
      }
    }

    return addSubscription(message);
  });

  /**
   * Trigger either the given subscription, or all subscriptions, to update.
   *
   * @event "subscriptions.update"
   * @property {string} [url]
   *   The subscription to update, if not specified all subscriptions will be
   *   updated.
   */
  port.on("subscriptions.update", async(message, sender) =>
  {
    await ewe.subscriptions.sync(message.url);
  });


  ewe.filters.onChanged.addListener(async(filter, property) =>
  {
    if (property !== "enabled")
      return;

    await updateCounters(filter.text, filter.enabled);
  });

  ewe.subscriptions.onRemoved.addListener(subscription =>
  {
    disabledFilterCounters.delete(subscription.url);
  });

  installHandler("filters", "added", emit =>
  {
    const onAdded = filter => emit(toSerializableFilter(filter));
    ewe.filters.onAdded.addListener(onAdded);
    return () => ewe.filters.onAdded.removeListener(onAdded);
  });

  installHandler("filters", "changed", emit =>
  {
    const onChanged = (filter, property) =>
      emit(toSerializableFilter(filter), property);
    ewe.filters.onChanged.addListener(onChanged);
    return () => ewe.filters.onChanged.removeListener(onChanged);
  });

  installHandler("filters", "removed", emit =>
  {
    const onRemoved = filter => emit(toSerializableFilter(filter));
    ewe.filters.onRemoved.addListener(onRemoved);
    return () => ewe.filters.onRemoved.removeListener(onRemoved);
  });

  installHandler("subscriptions", "added", emit =>
  {
    const onAdded = subscription =>
    {
      emit(toSerializableSubscription(subscription));
    };
    ewe.subscriptions.onAdded.addListener(onAdded);
    return () => ewe.subscriptions.onAdded.removeListener(onAdded);
  });

  installHandler("subscriptions", "changed", emit =>
  {
    const onChanged = (subscription, property) =>
    {
      emit(toSerializableSubscription(subscription), property);
    };
    ewe.subscriptions.onChanged.addListener(onChanged);
    return () => ewe.subscriptions.onChanged.removeListener(onChanged);
  });

  installHandler("subscriptions", "filtersDisabled", emit =>
  {
    const onFiltersDisabled = (subscription, hadFilters, hasFilters) =>
    {
      emit(toSerializableSubscription(subscription), hadFilters, hasFilters);
    };
    eventEmitter.on("filtersDisabled", onFiltersDisabled);
    return () => eventEmitter.off("filtersDisabled", onFiltersDisabled);
  });

  installHandler("subscriptions", "removed", emit =>
  {
    const onRemoved = subscription =>
    {
      emit(toSerializableSubscription(subscription));
    };
    ewe.subscriptions.onRemoved.addListener(onRemoved);
    return () => ewe.subscriptions.onRemoved.removeListener(onRemoved);
  });
}
