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

function requireData(filepath)
{
  const xhr = new XMLHttpRequest();
  xhr.open("GET", filepath, false);

  try
  {
    xhr.send();
    if (xhr.status !== 200)
      throw new Error("Unable to fetch file");

    return JSON.parse(xhr.responseText);
  }
  catch (ex)
  {
    return [];
  }
}

const sources = requireData("data/subscriptions.json");

function *recommendations()
{
  yield* sources;
}

export default recommendations;
