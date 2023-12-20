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
 * Handles clicks on links for opening the settings page
 */
function onClick(event: Event): void {
  if (!event.isTrusted) {
    return;
  }

  const element = event.target;
  if (!(element instanceof HTMLElement)) {
    return;
  }

  if (!element.matches(`[data-extension-page="options"]`)) {
    return;
  }

  event.stopPropagation();
  event.preventDefault();

  void browser.runtime.sendMessage({
    type: "options.open",
    followUpMessage: {
      type: "app.respond",
      action: "focusSection",
      args: ["advanced"]
    }
  });
}

function start(): void {
  document.addEventListener("click", onClick);
}

start();
