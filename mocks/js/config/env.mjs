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

function updateFromURL(data)
{
  if (window.top.location.search)
  {
    const params = window.top.location.search.substr(1).split("&");

    for (const param of params)
    {
      const parts = param.split("=", 2);
      if (parts.length == 2 && parts[0] in data)
      {
        let value = decodeURIComponent(parts[1]);
        if (value === "false" || value === "true")
        {
          value = (value === "true");
        }
        data[parts[0]] = value;
      }
    }
  }
}

export const info = {
  platform: "gecko",
  platformVersion: "34.0",
  application: "firefox",
  applicationVersion: "34.0",
  addonName: "adblockplus",
  addonVersion: "2.6.7"
};
updateFromURL(info);

export const params = {
  additionalSubscriptions: "",
  addSubscription: false,
  blockedURLs: "",
  composerActive: true,
  dataCorrupted: false,
  downloadStatus: "synchronize_ok",
  filtersDisabled: false,
  filterError: null,
  filterOption: null,
  includeUnknownSubscription: false,
  notification: null,
  domainAllowlisted: false,
  pageAllowlisted: false,
  reinitialized: false,
  showPageOptions: false
};
updateFromURL(params);
