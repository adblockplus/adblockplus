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

import { addSubscription } from "../../../adblockpluschrome/lib/filterConfiguration";
import * as premium from "../../premium/background";
import { premiumTypes } from "../shared";

/**
 * Returns a list of premium subscriptions.
 *
 * @returns A list of premium subscriptions
 */
function getPremiumSubscriptions(): ewe.Recommendation[] {
  // The subscription of the "annoyances" type is the DC subscription
  return ewe.subscriptions
    .getRecommendations()
    .filter(({ type }) => premiumTypes.has(type));
}

/**
 * Adds premium subscriptions that should be installed by default.
 *
 * @returns A Promise that settles after the process of adding
 * the subscriptions gets fulfilled or rejected
 */
async function addOptoutPremiumSubscriptions(): Promise<void> {
  const subscriptions = getPremiumSubscriptions();

  for (const subscription of subscriptions) {
    if (
      !(await ewe.subscriptions.has(subscription.url)) &&
      subscription.type === "annoyances"
    ) {
      await addSubscription(subscription);
      break;
    }
  }
}

/**
 * Removes all premium subscriptions.
 *
 * @returns A Promise that settles after the process of removing
 * the subscriptions gets fulfilled or rejected
 */
async function removePremiumSubscriptions(): Promise<void> {
  const subscriptions = getPremiumSubscriptions();

  for (const subscription of subscriptions) {
    if (await ewe.subscriptions.has(subscription.url)) {
      await ewe.subscriptions.remove(subscription.url);
    }
  }
}

async function getActiveSubscriptions(): Promise<ewe.Subscription[]> {
  return await ewe.subscriptions.getSubscriptions();
}

// TODO: return the two subscriptions with their state
// TODO: unit test this
// TODO: return type
function computePremiumState(
  premiumSubscriptions: ewe.Recommendation[],
  activeSubscriptions: ewe.Subscription[]
): any {
  console.log({ premiumSubscriptions, activeSubscriptions });
  return premiumSubscriptions;
}

// TODO: return type
export async function getPremiumSubscriptionsState(): Promise<any> {
  const premiumSubscriptions = getPremiumSubscriptions();
  const activeSubscriptions = await getActiveSubscriptions();
  return computePremiumState(premiumSubscriptions, activeSubscriptions);
}

/**
 * Initializes Premium subscriptions in the background context.
 */
export function start(): void {
  premium.emitter.on("deactivated", () => {
    void removePremiumSubscriptions();
  });

  premium.emitter.on("activated", () => {
    void addOptoutPremiumSubscriptions();
  });
}
