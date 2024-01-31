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

import { type Message, type PremiumActivateOptions } from "./api.types";

/**
 * Checks whether given candidate is a message
 *
 * @param candidate - Message candidate
 *
 * @returns whether candidate is message
 */
export function isMessage(candidate: unknown): candidate is Message {
  return (
    candidate !== null && typeof candidate === "object" && "type" in candidate
  );
}

/**
 * Checks whether given candidate is mesage of type "premium.activate"
 *
 * @param candidate - Candidate
 *
 * @returns whether candidate is message of type "premium.activate"
 */
export function isPremiumActivateOptions(
  candidate: unknown
): candidate is PremiumActivateOptions {
  return (
    candidate !== null && typeof candidate === "object" && "userId" in candidate
  );
}
