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

/**
 * Timing name
 */
export enum Timing {
  afterWebAllowlisting = "after_web_allowlisting",
  immediate = "immediate",
  revisitWebAllowlisted = "revisit_web_allowlisted_site",
  afterNavigation = "after_navigation"
}

/**
 * On-page UI timing configuration
 */
export interface TimingConfiguration {
  /**
   * Number of hours after which on-page dialog can be shown again
   */
  cooldownDuration: number;
  /**
   * Maximum number of minutes after the page was allowlisted that the on-page
   * dialog can be shown for the first time
   */
  maxAllowlistingDelay?: number;
  /**
   * Maximum number of times the on-page dialog can be shown
   */
  maxDisplayCount: number;
  /**
   * Minimum number of minutes after the page was allowlisted that the on-page
   * dialog can be shown for the first time
   */
  minAllowlistingDelay?: number;
}
