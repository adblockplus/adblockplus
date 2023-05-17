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

import * as eweImport from "../../../vendor/webext-sdk/dist/ewe-api";

import { allowlist } from "../../../adblockpluschrome/lib/allowlisting";
import { Prefs } from "../../../adblockpluschrome/lib/prefs";
import * as premium from "../../premium/background";

// We cannot declare EWE as an ambient module, so we need to assign it
// to an interface instead, until we import it as an npm module
const ewe = eweImport as unknown as EWE;

/**
 * Function to be called when a valid allowlisting request was received
 *
 * @param domain - Domain to allowlist
 */
async function onAllowlisting(domain: string): Promise<void> {
  if (premium.getPremiumState().isActive) return;

  await allowlist({
    hostname: domain,
    origin: "web"
  });
}

/**
 * Remove all web based allowlisting filters
 */
async function removeWebAllowlistingFilters(): Promise<void> {
  const allowlistingFilters = (await ewe.filters.getUserFilters()).filter(
    (filter) => filter.type === "allowing"
  );

  const allowlistingFiltersWithMetadata = await Promise.all(
    allowlistingFilters.map(async (filter) => {
      const metadata = await ewe.filters.getMetadata(filter.text);
      return { filter, metadata };
    })
  );

  const webAllowlistingFilters = allowlistingFiltersWithMetadata
    .filter(({ metadata }) => metadata && metadata.origin === "web")
    .map(({ filter }) => filter);

  return ewe.filters.remove(
    webAllowlistingFilters.map((filter) => filter.text)
  );
}

/**
 * Initializes experimental allowlisting API
 */
async function start(): Promise<void> {
  const authorizedKeys = Prefs.get("allowlisting_authorizedKeys") as string[];
  void ewe.allowlisting.setAuthorizedKeys(authorizedKeys);
  void ewe.allowlisting.setAllowlistingCallback(onAllowlisting);

  // Make sure the premium state is only read after the storage was loaded
  await Prefs.untilLoaded;

  if (premium.getPremiumState().isActive) {
    void removeWebAllowlistingFilters();
  }

  premium.emitter.on("activated", async () => {
    void ewe.allowlisting.setAuthorizedKeys([]);
    void removeWebAllowlistingFilters();
  });

  premium.emitter.on("deactivated", () => {
    void ewe.allowlisting.setAuthorizedKeys(authorizedKeys);
  });
}

start();
