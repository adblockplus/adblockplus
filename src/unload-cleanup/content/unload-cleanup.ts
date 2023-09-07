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

import { DisplayValue, messageName } from "../shared";

/**
 * Prepares an injected element for extension unload.
 *
 * @param element
 * @param displayValue
 */
export function prepareElementForUnload(
  element: HTMLElement,
  displayValue: DisplayValue
) {
  browser.runtime.sendMessage(messageName, (className: string | undefined) => {
    if (typeof className === "undefined") {
      // Background did not insert a style sheet.
      // Do not add clean-up classes.
      return;
    }
    element.classList.add(`${className}--${displayValue}`);
    element.style.display = "none";
  });
}
