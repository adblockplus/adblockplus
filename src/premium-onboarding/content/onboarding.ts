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

import * as api from "../../core/api/front";

/**
 * Handles clicks on page
 *
 * @param event - Click event
 */
function onClick(event: Event): void {
  if (!event.isTrusted) {
    return;
  }

  const element = event.target;
  if (!(element instanceof HTMLElement)) {
    return;
  }

  if (!element.matches(`[data-extension-page="premium-onboarding"]`)) {
    return;
  }

  event.stopPropagation();
  event.preventDefault();

  void api.app.open("premium-onboarding", { replaceTab: true });
}

/**
 * Initializes Premium onboarding trigger
 */
function start(): void {
  document.addEventListener("click", onClick);
}

start();
