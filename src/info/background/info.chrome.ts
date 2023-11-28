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

import { Info } from "./info.types";
import { getMajorVersion } from "./version";

const addonName = "{{addonName}}";
const baseName = "adblockplus";
const addonVersion = "{{addonVersion}}";
let application = "";
let applicationVersion = "";
const platform = "chromium";
let platformVersion = "";

const regexp = /(\S+)\/(\S+)(?:\s*\(.*?\))?/g;
let match;

while ((match = regexp.exec(navigator.userAgent))) {
  const app = match[1];
  const ver = getMajorVersion(match[2]);

  if (app === "Chrome") {
    platformVersion = ver;
  }
  // For compatibility with legacy websites, Chrome's UA
  // also includes a Mozilla, AppleWebKit and Safari token.
  // Any further name/version pair indicates a fork.
  else if (app !== "Mozilla" && app !== "AppleWebKit" && app !== "Safari") {
    if (app === "Edg") {
      application = "edge";
    } else if (app === "OPR") {
      application = "opera";
    } else {
      application = app.toLowerCase();
    }

    applicationVersion = ver;
  }
}

// not a Chromium-based UA, probably modified by the user
if (platformVersion === "") {
  application = "unknown";
  applicationVersion = platformVersion = "0";
}

// no additional name/version, so this is upstream Chrome
if (application === "") {
  application = "chrome";
  applicationVersion = platformVersion;
}

export const info: Info = {
  addonName,
  baseName,
  addonVersion,
  application,
  applicationVersion,
  platform,
  platformVersion
};
