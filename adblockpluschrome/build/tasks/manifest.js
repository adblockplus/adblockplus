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

import {resolve} from "path";
import fs from "fs";
import {Readable} from "stream";
import Vinyl from "vinyl";

let manifest;

async function editManifest(data, version, channel, target)
{
  data.version = version;
  data.name = `__MSG_name_${channel == "development" ? "dev" : channel}build__`;

  if (target == "chrome")
    delete data.applications;

  if (target == "firefox")
  {
    let {gecko} = data.applications;

    if (channel == "development")
      gecko.id = gecko.app_id_devbuild;
    else
      gecko.id = gecko.app_id_release;

    delete gecko.app_id_devbuild;
    delete gecko.app_id_release;

    delete data.minimum_chrome_version;
    delete data.minimum_opera_version;
    if ("action" in data)
      delete data.action.default_popup;
    if ("browser_action" in data)
      delete data.browser_action.default_popup;
    delete data.optional_permissions;
    delete data.storage;

    data.applications.gecko = gecko;
  }

  if ("declarative_net_request" in data)
  {
    const rules = await getJSON(
      "../node_modules/@adblockinc/rules/dist/manifest/adblockplus.json"
    );
    data.declarative_net_request = rules;
  }

  return data;
}

export function createManifest(contents)
{
  return new Readable.from([
    new Vinyl({
      contents: Buffer.from(JSON.stringify(contents, null, 2)),
      path: "manifest.json"
    })
  ]);
}

async function getJSON(path)
{
  let content = await fs.promises.readFile(resolve(path));
  return JSON.parse(content);
}

export async function getManifestContent(options)
{
  const {target, version, channel, manifestPath, manifestVersion} = options;
  if (manifest)
    return manifest;

  let raw;
  if (manifestPath)
  {
    raw = await getJSON(resolve(manifestPath));
  }
  else
  {
    let base = await getJSON("build/manifest.base.json");
    let specific = await getJSON(`build/manifest.v${manifestVersion}.json`);
    raw = Object.assign({}, base, specific);
  }

  manifest = await editManifest(raw, version, channel, target);

  return manifest;
}
