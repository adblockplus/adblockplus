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

import { type DialogContent } from "../shared";
import { type Dialog, type DialogBehavior } from "./dialog.types";

/**
 * Checks whether given candidate is dialog information
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate is dialog information
 */
export function isDialog(candidate: unknown): candidate is Dialog {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "behavior" in candidate &&
    "content" in candidate
  );
}

/**
 * Checks whether given candidate is on-page behavior
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate is on-page behavior
 */
export function isDialogBehavior(
  candidate: unknown
): candidate is DialogBehavior {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "displayDuration" in candidate &&
    "target" in candidate &&
    "timing" in candidate
  );
}

/**
 * Checks whether given candidate is on-page content
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate is on-page content
 */
export function isDialogContent(
  candidate: unknown
): candidate is DialogContent {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "body" in candidate &&
    "button" in candidate &&
    "title" in candidate
  );
}
