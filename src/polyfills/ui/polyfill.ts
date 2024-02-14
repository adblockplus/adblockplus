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

/**
 * Close current tab
 */
export async function closeCurrentTab(): Promise<void> {
  // We'd rather just call window.close, but that isn't working consistently with
  // Firefox 57, even when allowScriptsToClose is passed to browser.windows.create
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=1418394
  // window.close is also broken on Firefox 63.x
  // See https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/issues/791#note_374617568
  try {
    const tab = await browser.tabs.getCurrent();
    if (typeof tab.id !== "number") {
      throw new Error("Current tab has no ID");
    }

    await browser.tabs.remove(tab.id);
  } catch (ex) {
    // Opera 68 throws a "Tabs cannot be edited right now (user may be
    // dragging a tab)." exception when we attempt to close the window
    // using `browser.tabs.remove`.
    window.close();
  }
}
