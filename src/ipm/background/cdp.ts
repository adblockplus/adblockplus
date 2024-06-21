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

import { Prefs } from "../../../adblockpluschrome/lib/prefs";
import { error as logError } from "../../logger/background";

async function applyOptOut(): Promise<void> {
  await ewe.cdp.setOptOut(Prefs.get("data_collection_opt_out"));
}

async function initOptOut(): Promise<void> {
  await Prefs.untilLoaded;

  await applyOptOut();
  Prefs.on("data_collection_opt_out", applyOptOut);
}

/**
 * Initializes the CDP.
 */
export async function initialize(): Promise<void> {
  try {
    await initOptOut();
  } catch (error) {
    logError("CDP initialization failed with error: ", error);
  }
}
