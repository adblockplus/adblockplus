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

import {Prefs} from "./prefs";

export function getLocalizedTexts(notif)
{
  const texts = {};
  if ("message" in notif)
  {
    texts.message = notif.message;
  }
  if ("title" in notif)
  {
    texts.title = notif.title;
  }
  return texts;
}

export function toggleIgnoreCategory(category)
{
  const categories = Prefs.notifications_ignoredcategories;
  const index = categories.indexOf(category);
  if (index == -1)
    categories.push(category);
  else
    categories.splice(index, 1);
  Prefs.notifications_ignoredcategories = categories;
}
