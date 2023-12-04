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
import { getUUID } from "../shared";

const installationIdStorageKey = "installation_id";

/**
 * Returns a unique id for this installation. Will stay the same until the
 * extension gets uninstalled or re-installed.
 *
 * @returns The installation id
 */
export async function getInstallationId(): Promise<string> {
  await Prefs.untilLoaded;

  let id = Prefs.get(installationIdStorageKey);

  if (id === "") {
    id = getUUID();
    void Prefs.set(installationIdStorageKey, id);
  }

  return id;
}
