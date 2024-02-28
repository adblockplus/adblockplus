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

/** @module contentFiltering */

import * as ewe from "@eyeo/webext-ad-filtering-solution";
import * as snippets from "@eyeo/snippets";
import {service as mlService} from "@eyeo/snippets/mlaf";

import {Prefs} from "./prefs.js";

function updateMlTelemetryOptout()
{
  mlService.setOptions({
    privateBrowsingTelemetry: false,
    telemetryOptOut: Prefs.get("data_collection_opt_out")
  });
}

export async function start()
{
  await Prefs.untilLoaded;

  ewe.snippets.setLibrary({
    injectedCode: snippets.main,
    isolatedCode: snippets.isolated
  });

  updateMlTelemetryOptout();
  Prefs.on("data_collection_opt_out", updateMlTelemetryOptout);
  browser.runtime.onMessage.addListener(mlService.messageListener);
}
