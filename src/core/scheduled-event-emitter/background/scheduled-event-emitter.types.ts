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

export enum ScheduleType {
  once = "once",
  interval = "interval"
}

export interface Schedule {
  /**
   * The time span between two scheduled broadcasts.
   */
  period: number;
  /**
   * The date (in ms since 1970) when the next broadcast is due.
   */
  next: number;
  /**
   * Whether to broadcast only once.
   */
  runOnce: boolean;
  /**
   * How many times the topic has been broadcasted yet.
   */
  count: number;
  /**
   * The internal id as returned by calling e.g. `setTimeout`. Can be used to
   * clear the associated given timeout / interval.
   */
  activationId?: number;
}

export interface ListenerInfo {
  /**
   * The number of the current call of the listener.
   */
  callCount: number;
}

/**
 * The listener to a  broadcast will receive one argument which holds
 * information about the call.
 */
export type Listener = (info: ListenerInfo) => void;
