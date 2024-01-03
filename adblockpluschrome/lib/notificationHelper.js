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

/** @module notificationHelper */

import * as ewe from "@eyeo/webext-ad-filtering-solution";

import {getPremiumState} from "../../src/premium/background/index.ts";
import {info} from "../../src/info/background";
import {initDay1Notification} from "../../lib/notifications.js";
import {showOptions} from "../../lib/pages/options.js";
import {port} from "./messaging/port.js";
import {SessionStorage} from "./storage/session.js";
import {askConfirmSubscription} from "./filterConfiguration.js";
import {startIconAnimation, stopIconAnimation} from "./icon.js";
import {Prefs} from "./prefs.js";
import {Stats} from "./stats.js";

/**
 * The active notification is (if any) the most recent currently displayed
 * notification. Once a notification is clicked or is superseded by another
 * notification we no longer consider it active.
 *
 * @typedef {Object} ActiveNotification
 */

/**
 * Key to store/retrieve the [active notification]{@link ActiveNotification}
 */
const activeNotificationKey = "activeNotification";

/**
 * When a notification button is clicked we need to look up what should
 * happen. This can be both for the active notification, and also for
 * notifications stashed in the notification center.
 *
 * @typedef {Object[]} NotificationButtons
 */

/**
 * Gets the key to store/retrieve the [buttons]{@link NotificationButtons} for
 * the notification with the given ID.
 *
 * @param {string} notificationId - Notification ID
 * @returns {string} Key for storing/retrieving notification buttons
 */
const getButtonsKey = notificationId => `buttons:${notificationId}`;

const session = new SessionStorage("notificationHelper");

/**
 * Maps notification types to display methods.
 */
const displayMethods = new Map([
  ["critical", ["icon", "notification", "popup"]],
  ["newtab", ["newtab"]],
  ["normal", ["notification"]],
  ["relentless", ["notification"]],
  ["information", ["icon", "popup"]]
]);
const defaultDisplayMethods = ["popup"];

const linkPlaceholders = [
  ["LANG", () => browser.i18n.getUILanguage().replace("-", "_")],
  ["ADDON_NAME", () => info.addonName],
  ["ADDON_VERSION", () => info.addonVersion],
  ["APPLICATION_NAME", () => info.application],
  ["APPLICATION_VERSION", () => info.applicationVersion],
  ["PLATFORM_NAME", () => info.platform],
  ["PLATFORM_VERSION", () => info.platformVersion]
];

// We must hard code any "abp:" prefixed notification links here, otherwise
// notifications linking to them will not be displayed at all.
const localNotificationPages = new Map([
  ["abp:day1", "/day1.html"],
  ["abp:problem", "/problem.html"],
  ["abp:updates", "/updates.html"]
]);

// We animate the ABP icon while some kinds of notifications are active, to help
// catch the user's attention.
let notificationIconAnimationPlaying = false;

// Opera < 57 and Firefox (tested up to 68.0.1) do not support notifications
// being created with buttons. Opera added button support with >= 57, however
// the button click handlers have broken with >= 60 (tested up to 62). Until
// Opera fixes that bug (reference DNAWIZ-70332) we unfortunately can't use
// feature detection when deciding if notification buttons should be displayed.
const browserNotificationButtonsSupported = info.platform == "chromium" &&
                                            info.application != "opera";

// As of August 2019, only Chrome supports this flag and, since Firefox
// throws on unsupported options (tested with version 69), we need to
// explicitly set it only for supported browsers.
const browserNotificationRequireInteractionSupported = (
  info.platform == "chromium" && parseInt(info.platformVersion, 10) >= 50
);

function matchesDisplayMethod(method, {type})
{
  let methods = displayMethods.get(type) || defaultDisplayMethods;
  return methods.includes(method);
}

function playNotificationIconAnimation(notification)
{
  if (matchesDisplayMethod("icon", notification))
  {
    startIconAnimation(notification.type);
    notificationIconAnimationPlaying = true;
  }
}

function getNotificationButtons({type: notificationType, links}, message)
{
  let buttons = [];
  let linkCount = 0;
  let regex = /<a>(.*?)<\/a>/g;
  let match;
  while (match = regex.exec(message))
  {
    buttons.push({
      type: "link",
      title: match[1],
      link: links[linkCount++]
    });
  }

  // We allow the user to disable non-essential notifications, and we add a
  // button to those notifications to make that easier to do.
  let addConfigureButton = isOptional(notificationType);

  // Chrome only allows two notification buttons so we need to fall back
  // to a single button to open all links if there are more than two.
  let maxButtons = addConfigureButton ? 1 : 2;
  if (buttons.length > maxButtons)
  {
    buttons = [
      {
        type: "open-all",
        title: browser.i18n.getMessage("notification_open_all"),
        links
      }
    ];
  }
  if (addConfigureButton)
  {
    buttons.push({
      type: "configure",
      title: browser.i18n.getMessage("notification_configure")
    });
  }

  return buttons;
}

function openNotificationLink(link)
{
  if (link.startsWith("abp:subscribe:"))
  {
    let [,, type, locale] = link.split(":", 4);
    for (let recommendation of ewe.subscriptions.getRecommendations())
    {
      if (recommendation.type != type ||
          !recommendation.languages.includes(locale))
        continue;

      askConfirmSubscription({
        homepage: recommendation.homepage,
        title: recommendation.title,
        url: recommendation.url
      });
      return;
    }

    console.error("No recommended subscription found");
    return;
  }

  let url;
  if (link.startsWith("abp:"))
    url = localNotificationPages.get(link);
  else
    url = Prefs.getDocLink(link);

  browser.tabs.create({url});
}

function getButtonLinks(buttons)
{
  let links = [];

  for (let button of buttons)
  {
    if (button.type == "link" && button.link)
      links.push(button.link);
    else if (button.type == "open-all" && button.links)
      links = links.concat(button.links);
  }
  return links;
}

async function openNotificationLinks(notificationId)
{
  let buttons = await session.get(getButtonsKey(notificationId)) || [];
  for (let link of getButtonLinks(buttons))
    openNotificationLink(link);
}

async function notificationButtonClick(notificationId, buttonIndex)
{
  let buttons = await session.get(getButtonsKey(notificationId));

  if (!(buttons && buttonIndex in buttons))
    return;

  let button = buttons[buttonIndex];

  switch (button.type)
  {
    case "link":
      openNotificationLink(button.link);
      break;
    case "open-all":
      await openNotificationLinks(notificationId);
      break;
    case "configure":
      await showOptions({
        type: "app.respond",
        action: "focusSection",
        args: ["notifications"]
      });
      break;
  }
}

/**
 * Tidy up after a notification has been dismissed.
 *
 * @param {string} notificationId
 * @param {bool} isStashed
 *   If the given notification is (or might be) stashed in the notification
 *   center, we must take care to remember what its buttons do. Leave as true
 *   unless you're sure!
 */
async function notificationDismissed(notificationId, isStashed)
{
  const activeNotification = await session.get(activeNotificationKey);
  if (activeNotification && activeNotification.id == notificationId)
  {
    await session.delete(activeNotificationKey);

    if (notificationIconAnimationPlaying)
    {
      stopIconAnimation();
      notificationIconAnimationPlaying = false;
    }
  }

  if (!isStashed)
    await session.delete(getButtonsKey(notificationId));
}

function openNotificationInNewTab(notification)
{
  let tabIds = new Set();
  let [url] = notification.links;
  for (let [key, getValue] of linkPlaceholders)
    url = url.replace(`%${key}%`, encodeURIComponent(getValue()));

  function openNotificationTab()
  {
    browser.tabs.onCreated.removeListener(onCreated);
    browser.tabs.onRemoved.removeListener(onRemoved);
    browser.tabs.onUpdated.removeListener(onUpdated);

    browser.tabs.create({url});
    void ewe.notifications.markAsShown(notification.id);
    void notificationDismissed(notification.id);
  }

  let onCreated = tab =>
  {
    // Firefox loads its New Tab Page immediately and doesn't notify us
    // when it's complete so we need to open our new tab already here.
    if (tab.url == "about:newtab")
    {
      openNotificationTab();
      return;
    }

    tabIds.add(tab.id);
  };

  let onRemoved = tabId =>
  {
    tabIds.delete(tabId);
  };

  let onUpdated = (tabId, changeInfo, tab) =>
  {
    // Only look at tabs that have been opened since we started listening
    // and that have completed loading.
    if (!tabIds.has(tabId) || !("status" in changeInfo) ||
        changeInfo.status != "complete")
      return;

    tabIds.delete(tabId);

    // Open our own new tab only when a new tab gets opened
    // that isn't part of the user browsing the web.
    if (/^https?:/.test(tab.url))
      return;

    openNotificationTab();
  };

  browser.tabs.onCreated.addListener(onCreated);
  browser.tabs.onRemoved.addListener(onRemoved);
  browser.tabs.onUpdated.addListener(onUpdated);
}

/**
 * Shows the given notification. Will not re-show the currently active
 * notification.
 *
 * @param {object} notification - The notification to show
 */
async function showNotification(notification)
{
  const activeNotification = await session.get(activeNotificationKey);
  if (activeNotification && activeNotification.id == notification.id)
    return;

  let texts = ewe.notifications.getLocalizedTexts(notification);
  let buttons = getNotificationButtons(notification, texts.message);

  // Don't display notifications at all if they contain a link to a local
  // notification page which we don't have.
  for (let link of getButtonLinks(buttons))
  {
    if (link.startsWith("abp:") &&
        !link.startsWith("abp:subscribe:") &&
        !localNotificationPages.has(link))
      return;
  }

  // We take a note of the notification's buttons even if notification buttons
  // are not supported by this browser. That way, if the user clicks the
  // (buttonless) notification we can still open all the links.
  await session.set(getButtonsKey(notification.id), buttons);

  await session.set(activeNotificationKey, notification);
  if (matchesDisplayMethod("notification", notification))
  {
    let notificationTitle = texts.title || "";
    let message = (texts.message || "").replace(/<\/?(a|strong)>/g, "");
    let iconUrl = browser.runtime.getURL("icons/logo/abp-128.png");

    let notificationOptions = {
      type: "basic",
      title: notificationTitle,
      iconUrl,
      message,
      // We use the highest priority to prevent the notification
      // from closing automatically, for browsers that don't support the
      // requireInteraction flag.
      priority: 2
    };

    if (browserNotificationButtonsSupported)
      notificationOptions.buttons = buttons.map(({title}) => ({title}));

    if (browserNotificationRequireInteractionSupported)
      notificationOptions.requireInteraction = true;

    browser.notifications.create(notification.id, notificationOptions);
  }

  playNotificationIconAnimation(notification);

  // Unlike other notifications, we cannot mark newtab-type notifications
  // as shown right away because they're not shown immediately.
  if (matchesDisplayMethod("newtab", notification))
  {
    const {installType} = await browser.management.getSelf();
    const {isActive: isPremiumUser} = getPremiumState();

    // Newtab notifications can be quite obtrusive and managed users may
    // see them more frequently than others so we shouldn't show such
    // notifications to them.

    // Because "newtab" notifications could potentially also contain upgrade
    // campaigns, we don't want to show them to premium users.

    if (installType === "admin" || isPremiumUser || navigator.webdriver)
    {
      void ewe.notifications.markAsShown(notification.id);
      void notificationDismissed(notification.id);
      return;
    }

    openNotificationInNewTab(notification);
  }
  else
  {
    void ewe.notifications.markAsShown(notification.id);
  }
}

/**
 * Initializes the notification system.
 *
 * @param {bool} firstRun
 */
export async function initNotifications(firstRun)
{
  let onClick = async(notificationId, buttonIndex) =>
  {
    if (typeof buttonIndex == "number")
      await notificationButtonClick(notificationId, buttonIndex);
    else if (!browserNotificationButtonsSupported)
      await openNotificationLinks(notificationId);

    // Chrome hides notifications in the notification center when clicked,
    // so we need to clear them.
    browser.notifications.clear(notificationId);

    // But onClosed isn't triggered when we clear the notification, so we need
    // to take care to clear our record of it here too.
    await notificationDismissed(notificationId, false);
  };
  browser.notifications.onButtonClicked.addListener(onClick);
  browser.notifications.onClicked.addListener(onClick);

  let onClosed = async(notificationId, byUser) =>
  {
    // Despite using the highest priority for our notifications, Windows 10
    // will still hide them after a few seconds and stash them in the
    // notification center. We still consider the notification active when
    // this happens, in order to continue animating the ABP icon and/or
    // displaying the notification details in our popup window.
    // Note: Even if the notification was closed by the user, it still might
    //       be stashed in the notification center.
    if (byUser)
      await notificationDismissed(notificationId, true);
  };
  browser.notifications.onClosed.addListener(onClosed);

  ewe.notifications.locale = browser.i18n.getUILanguage();
  ewe.notifications.numBlocked = Stats.blocked_total;
  await ewe.notifications.start();

  // If there is an active notification of the "newtab" type on startup, call
  // openNotificationInNewTab() to activate it again. If we don't do this,
  // the notification tab will not be opened when the user opens a new tab.
  session.get(activeNotificationKey).then(notification =>
  {
    if (!notification || !matchesDisplayMethod("newtab", notification))
      return;

    openNotificationInNewTab(notification);
  });

  if (firstRun)
    initDay1Notification();
}

/**
 * If the given notification type is of vital importance return false,
 * true otherwise.
 *
 * @param {string} notificationType
 * @return {boolean}
 */
export function isOptional(notificationType)
{
  return !["critical", "relentless"].includes(notificationType);
}

/**
 * Sent when a popup notification is clicked. If link is specified, that is
 * opened, otherwise the notification is dismissed.
 *
 * @event "notifications.clicked"
 * @property {number} id - ID of the clicked notification
 * @property {string} [link] - Notification link to open
 */
port.on("notifications.clicked", async(message, sender) =>
{
  if (message.link)
    openNotificationLink(message.link);

  // While clicking on a desktop notification's button dismisses the
  // notification, clicking on a popup window notification's link does not.
  if (!message.link || message.link.startsWith("abp:subscribe:"))
  {
    browser.notifications.clear(message.id);
    await notificationDismissed(message.id, true);
  }
});

/**
 * Returns the active notification if there is one and if it applies to the
 * given url and/or display method.
 *
 * @event "notifications.get"
 * @property {string} [displayMethod]
 *   Display method to check that the active notification matches.
 *   For example "popup" or "icon".
 * @returns {?object}
 */
port.on("notifications.get", async(message, sender) =>
{
  const activeNotification = await session.get(activeNotificationKey);
  if (!activeNotification)
    return;

  if ("displayMethod" in message &&
      !matchesDisplayMethod(message.displayMethod, activeNotification))
    return;

  let texts = ewe.notifications.getLocalizedTexts(activeNotification);
  return Object.assign({texts}, activeNotification);
});

/**
 * Sent when a popup notification was shown to the user. Stops icon animation.
 *
 * @event "notifications.seen"
 */
port.on("notifications.seen", async(message, sender) =>
{
  const activeNotification = await session.get(activeNotificationKey);
  if (!activeNotification)
    return;

  if (matchesDisplayMethod("popup", activeNotification) &&
      matchesDisplayMethod("icon", activeNotification))
    stopIconAnimation();
});

Stats.on("blocked_total", () =>
{
  ewe.notifications.numBlocked = Stats.blocked_total;
  void ewe.notifications.showNext();
});

ewe.notifications.addShowListener(showNotification);
