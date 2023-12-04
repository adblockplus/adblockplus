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

import { Prefs } from "../../../adblockpluschrome/lib/prefs";
import { type Stats } from "./stats.types";

/**
 * Key for stats storage
 */
const statsStorageKey = "onpage_dialog_command_stats";

/**
 * Clears stats for given IPM ID
 *
 * @param ipmId - IPM ID
 */
export function clearStats(ipmId: string): void {
  const statsStorage = Prefs.get(statsStorageKey);
  // We can't use a Map or Set for `statsStorage`, so we need dynamic
  // deletion here.
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete statsStorage[ipmId];
  void Prefs.set(statsStorageKey, statsStorage);
}

/**
 * Retrieves stats for given IPM ID
 *
 * @param ipmId - IPM ID
 *
 * @returns stats
 */
export function getStats(ipmId: string): Stats | null {
  const statsStorage = Prefs.get(statsStorageKey);
  return statsStorage[ipmId] || null;
}

/**
 * Checks whether given candidate is stats
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate is stats
 */
export function isStats(candidate: unknown): candidate is Stats {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "displayCount" in candidate &&
    "lastDisplayTime" in candidate
  );
}

/**
 * Sets stats for given IPM ID
 *
 * @param ipmId - IPM ID
 * @param stats - Stats
 */
export function setStats(ipmId: string, stats: Stats): void {
  const storage = Prefs.get(statsStorageKey);
  storage[ipmId] = stats;
  void Prefs.set(statsStorageKey, storage);
}
