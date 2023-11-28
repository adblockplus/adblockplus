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
let application = "unknown";
let applicationVersion = "0";
const platform = "gecko";
let platformVersion = "0";

const match = /\brv:(\d+(?:\.\d+)?)\b/.exec(navigator.userAgent);
if (match) {
  platformVersion = getMajorVersion(match[1]);
}

browser.runtime.getBrowserInfo().then((browserInfo) => {
  application = browserInfo.name.toLowerCase();
  applicationVersion = getMajorVersion(browserInfo.version);
});

export const info: Info = {
  addonName,
  baseName,
  addonVersion,
  get application() {
    return application;
  },
  get applicationVersion() {
    return applicationVersion;
  },
  platform,
  platformVersion
};
