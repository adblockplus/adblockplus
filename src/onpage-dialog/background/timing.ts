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

import * as ewe from "@eyeo/webext-sdk";

import { Prefs } from "../../../adblockpluschrome/lib/prefs";

import * as logger from "../../logger/background";
import { isFilterMetadata } from "../../polyfills/background";
import { DialogBehavior, Timing, isTiming } from "./middleware";
import { Stats } from "./stats.types";
import { TimingConfiguration } from "./timing.types";
import { Tabs } from "webextension-polyfill";
import { isActiveOnDomain } from "../../core/url/shared";

/**
 * Key for on-page dialog timing configurations storage
 */
const configsStorageKey = "onpage_dialog_timing_configurations";

/**
 * Timing configurations
 */
const knownConfigs = new Map<Timing, TimingConfiguration>();

/**
 * Retrieves time at which given tab was web-allowlisted. If more than one
 * web-allowlisting filters apply to the tab, only one will be considered.
 *
 * @param tabId - Tab ID
 *
 * @returns time at which given tab was web-allowlisted, or `null` if tab
 *   is not web-allowlisted
 */
async function getAllowlistingTime(tabId: number): Promise<number | null> {
  const allowlistingFilterTexts = await ewe.filters.getAllowingFilters(tabId);
  if (allowlistingFilterTexts.length === 0) {
    return null;
  }

  for (const filterText of allowlistingFilterTexts) {
    const metadata = await ewe.filters
      .getMetadata(filterText)
      .catch(() => null);
    if (!isFilterMetadata(metadata)) {
      continue;
    }

    if (metadata.origin !== "web") {
      continue;
    }

    return metadata.created;
  }

  return null;
}

/**
 * Checks whether given candidate is on-page UI timing configuration
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate is on-page UI timing configuration
 */
function isTimingConfiguration(
  candidate: unknown
): candidate is TimingConfiguration {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "cooldownDuration" in candidate &&
    "maxDisplayCount" in candidate
  );
}

/**
 * Checks whether the given timestamp is within the given number of minutes
 * in the past
 *
 * @param timestamp - Timestamp
 * @param minutes - Number of minutes in the past
 *
 * @returns whether the given timestamp is old enough
 */
function isWithin(timestamp: number, minutes: number): boolean {
  return timestamp < Date.now() - minutes * 60 * 1000;
}

/**
 * Initializes timing configurations from preferences
 */
function initializeConfigs(): void {
  const configs = Prefs.get(configsStorageKey);
  for (const [timing, config] of Object.entries(configs)) {
    if (!isTiming(timing) || !isTimingConfiguration(config)) {
      logger.warn("[onpage-dialog] Unknown timing configuration", timing);
      continue;
    }

    knownConfigs.set(timing, config);
  }
  logger.debug("[onpage-dialog]: Known timing configurations", knownConfigs);
}

/**
 * Determines whether command should be dismissed
 *
 * @param timing - Timing name
 * @param stats - On-page stats
 *
 * @returns whether command should be dismissed
 */
export function shouldBeDismissed(timing: Timing, stats: Stats): boolean {
  const config = knownConfigs.get(timing);
  if (!config) {
    logger.debug("[onpage-dialog]: Unknown timing");
    return true;
  }

  logger.debug(
    "[onpage-dialog]: Display count",
    `${stats.displayCount}/${config.maxDisplayCount}`
  );
  return stats.displayCount >= config.maxDisplayCount;
}

/**
 * Determines whether afterWebAllowlisting or the
 * revisitWebAllowlisted command should be shown
 *
 * @param timing - Timing name
 * @param tab - Tab
 * @param stats - On-page stats
 *
 * @returns whether command should be shown
 */
async function shouldBeShownForAfterWebAllowlisting(
  timing: Timing,
  tab: Tabs.Tab,
  stats: Stats
): Promise<boolean> {
  const tabId = tab.id || browser.tabs.TAB_ID_NONE;
  const config = knownConfigs.get(timing);
  if (!config) {
    logger.debug("[onpage-dialog]: Unknown timing");
    return false;
  }

  const allowlistingTime = await getAllowlistingTime(tabId);
  if (allowlistingTime === null) {
    logger.debug("[onpage-dialog]: Not allowlisted");
    return false;
  }

  // Ignore if allowlisting happened too long ago
  if (
    typeof config.maxAllowlistingDelay === "number" &&
    isWithin(allowlistingTime, config.maxAllowlistingDelay)
  ) {
    logger.debug("[onpage-dialog]: Allowlisted too long ago");
    return false;
  }

  // Ignore if allowlisting happened too recently
  if (
    typeof config.minAllowlistingDelay === "number" &&
    !isWithin(allowlistingTime, config.minAllowlistingDelay)
  ) {
    logger.debug("[onpage-dialog]: Allowlisted too recently");
    return false;
  }

  // Wait a bit before triggering command again
  if (!isWithin(stats.lastDisplayTime, config.cooldownDuration * 60)) {
    logger.debug("[onpage-dialog]: Dialog shown too recently");
    return false;
  }

  return true;
}
/**
 * Determines whether command should be shown
 *
 * @param behavior - The behavior of the command
 * @param tab - Tab
 * @param stats - On-page stats
 *
 * @returns whether command should be shown
 */
export async function shouldBeShown(
  behavior: DialogBehavior,
  tab: Tabs.Tab,
  stats: Stats
): Promise<boolean> {
  const { domainList, timing } = behavior;

  // Ignore commands that should have already been dismissed
  if (shouldBeDismissed(timing, stats)) {
    logger.debug("[onpage-dialog]: No more dialogs to show for command");
    return false;
  }

  // dialogs related to web allowlisting need an extra check
  const isWebAllowlistingRelated = [
    Timing.afterWebAllowlisting,
    Timing.revisitWebAllowlisted
  ].includes(timing);
  if (
    isWebAllowlistingRelated &&
    !(await shouldBeShownForAfterWebAllowlisting(timing, tab, stats))
  ) {
    return false;
  }

  // Check if there are domains for the command
  return isActiveOnDomain(tab.url || "", domainList);
}

/**
 * Initializes timing module
 */
export async function start(): Promise<void> {
  await Prefs.untilLoaded;

  initializeConfigs();

  Prefs.on(configsStorageKey, () => {
    initializeConfigs();
  });
}
