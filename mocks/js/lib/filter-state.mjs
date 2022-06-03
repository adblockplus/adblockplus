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

import filterNotifier from "./filter-notifier";

const map = new Map();

const filterState = {
  isEnabled(filterText)
  {
    const state = map.get(filterText);
    return state ? !state.disabled : true;
  },
  setEnabled(filterText, enabled)
  {
    const oldEnabled = this.isEnabled(filterText);

    if (enabled)
      map.delete(filterText);
    else
      map.set(filterText, {disabled: true});

    if (enabled !== oldEnabled)
    {
      filterNotifier.emit("filterState.enabled", filterText, enabled,
                          oldEnabled);
    }
  }
};

export default filterState;
