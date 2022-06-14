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

import api from "../../api";
import {$} from "../../dom";
import IOElement from "../../io-element";
import {setPref} from "./utils";

api.notifications.get("popup")
  .then((notification) =>
  {
    if (notification)
    {
      window.dispatchEvent(
        new CustomEvent("extension:notification", {detail: notification})
      );
      api.notifications.seen();
    }
  });

// Using an event to make testing as easy as possible.
/* @example
dispatchEvent(new CustomEvent("extension:notification", {
  detail: {
    type: "information", // or "critical"
    texts: {
      title: "Title for a notification",
      message: "There is something to read here"
    }
  }
}));
*/
window.addEventListener(
  "extension:notification",
  (event) =>
  {
    const notification = event.detail;
    const notifier = IOElement.wire()`
    <div class="${"content " + notification.type}">
      <div>
        <h3 hidden="${!notification.texts.title}">
          <span>${notification.texts.title}</span>
        </h3>
        <p id="notification-message"></p>
        <hr>
        <button onclick="${dismiss}">
          ${{i18n: "overlay_notification_closing_button_hide"}}
        </button>
        <button
          data-pref="notifications_ignoredcategories"
          hidden="${/^(?:critical|relentless)$/.test(notification.type)}"
          onclick="${dismiss}">
          ${{i18n: "overlay_notification_closing_button_optout"}}
        </button>
      </div>
    </div>`;

    const container = $("#notification");
    container.innerHTML = "";
    container.appendChild(notifier);
    container.removeAttribute("hidden");

    const messageElement = $("#notification-message", notifier);
    insertMessage(
      messageElement,
      notification.texts.message,
      (notification.links || []).map((link) => `#${link}`)
    );

    messageElement.addEventListener("click", evt =>
    {
      const link = evt.target.closest("a");
      // The contains(other) method, when invoked,
      // must return true if other is an inclusive descendant
      // of context object, and false otherwise
      // (including when other is null).
      if (!messageElement.contains(link))
        return;

      evt.preventDefault();
      evt.stopPropagation();

      const linkTarget = link.hash.slice(1);
      if (!linkTarget)
        throw new Error("Link has no target");

      browser.runtime.sendMessage({
        type: "notifications.clicked",
        id: notification.id,
        link: linkTarget
      })
      .then(() => window.close());
    });

    function dismiss(evt)
    {
      const el = evt.currentTarget;
      if (el.dataset.pref)
        setPref(el.dataset.pref, true);
      container.setAttribute("hidden", "");
      notifier.parentNode.removeChild(notifier);
      browser.runtime.sendMessage({
        type: "notifications.clicked",
        id: notification.id
      });
    }

    function insertMessage(element, text, links)
    {
      const match = /^(.*?)<(a|strong)>(.*?)<\/\2>(.*)$/.exec(text);
      if (!match)
      {
        element.appendChild(document.createTextNode(text));
        return;
      }

      const before = match[1];
      const tagName = match[2];
      const value = match[3];
      const after = match[4];

      insertMessage(element, before, links);

      const newElement = document.createElement(tagName);
      if (tagName == "a" && links && links.length)
        newElement.href = links.shift();
      insertMessage(newElement, value, links);
      element.appendChild(newElement);

      insertMessage(element, after, links);
    }
  },
  {once: true}
);
