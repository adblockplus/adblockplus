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
 * Initializes options page
 */
async function start() {
  const os = await api.app.get("os");

  const iframe = document.getElementById("content");
  if (!(iframe instanceof HTMLIFrameElement)) {
    return;
  }

  iframe.addEventListener("load", () => {
    document.title = iframe.contentDocument?.title || "";
  });

  // Load the mobile version of the options page on Android.
  const frameUrl =
    iframe.getAttribute("data-src-" + os) || iframe.getAttribute("data-src");
  if (!frameUrl) {
    return;
  }

  iframe.setAttribute("src", frameUrl);
}

void start().catch(console.error);
