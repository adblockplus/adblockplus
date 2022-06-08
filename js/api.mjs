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

const platformToStore = new Map([
  ["chromium", "chrome"],
  ["edgehtml", "edge"],
  ["gecko", "firefox"]
]);
const connectListeners = new Set();
const disconnectListeners = new Set();
const messageListeners = new Set();

let port = null;

function getInfo()
{
  return Promise.all([
    app.get("application"),
    app.get("platform")
  ])
  .then(([application, platform]) =>
  {
    let store = application;
    // Edge and Opera have their own stores so we should refer to those instead
    if (application !== "edge" && application !== "opera")
    {
      store = platformToStore.get(platform) || "chrome";
    }

    return {application, platform, store};
  });
}

function listen(type, filter, options = {})
{
  addConnectListener(() =>
  {
    port.postMessage({
      type: `${type}.listen`,
      filter,
      ...options
    });
  });
}

function send(type, args)
{
  return browser.runtime.sendMessage({
    ...args,
    type
  });
}

/*******************************************************************************
 * Messaging API
 ******************************************************************************/

const app = {
  get: (what) => send("app.get", {what}),
  getInfo,
  listen: (filter) => listen("app", filter),
  open: (what) => send("app.open", {what})
};

const doclinks = {
  get: (link) => send("app.get", {what: "doclink", link})
};

const filters = {
  get: () => send("filters.get"),
  listen: (filter) => listen("filters", filter)
};

const notifications = {
  get: (displayMethod) => send("notifications.get", {displayMethod}),
  seen: () => send("notifications.seen")
};

const prefs = {
  get: (key) => send("prefs.get", {key}),
  listen: (filter) => listen("prefs", filter)
};

const requests = {
  listen: (tabId, filter) => listen("requests", filter, {tabId})
};

const subscriptions = {
  get: (options) => send("subscriptions.get", options),
  getInitIssues: () => send("subscriptions.getInitIssues"),
  listen: (filter) => listen("subscriptions", filter)
};

const stats = {
  getBlockedPerPage: (tab) => send("stats.getBlockedPerPage", {tab}),
  getBlockedTotal: () => send("stats.getBlockedTotal"),
  listen: (filter) => listen("stats", filter)
};

/*******************************************************************************
 * Communication port setup
 ******************************************************************************/

function addConnectListener(listener)
{
  connectListeners.add(listener);
  listener();
}

function addDisconnectListener(listener)
{
  disconnectListeners.add(listener);
}

function addMessageListener(listener)
{
  messageListeners.add(listener);
}

function removeDisconnectListener(listener)
{
  disconnectListeners.delete(listener);
}

function onMessage(message)
{
  if (!message.type.endsWith(".respond"))
    return;

  for (const listener of messageListeners)
  {
    listener(message);
  }
}

function connect()
{
  // We're only establishing one connection per page, for which we need to
  // ignoresubsequent connection attempts
  if (port)
    return;

  try
  {
    port = browser.runtime.connect({name: "ui"});
  }
  catch (ex)
  {
    // We are no longer able to connect to the background page, so we give up
    // and assume that the extension is gone
    port = null;
    for (const listener of disconnectListeners)
    {
      listener();
    }
    return;
  }

  port.onMessage.addListener((...args) =>
  {
    onMessage(...args);
  });

  // When the connection to the background page drops, we try to reconnect,
  // assuming that the extension is still there, in order to wake up the
  // service worker
  port.onDisconnect.addListener(() =>
  {
    port = null;
    // If the disconnect occurs due to the extension being unloaded, we may
    // still be able to reconnect while that's ongoing, which misleads us into
    // thinking that the extension is still there. Therefore we need to wait
    // a little bit before trying to reconnect.
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1312478
    setTimeout(() => connect(), 100);
  });

  for (const listener of connectListeners)
  {
    listener();
  }
}

const apiMethods = {
  addDisconnectListener,
  addListener: addMessageListener,
  connect,
  removeDisconnectListener,
  app,
  doclinks,
  filters,
  notifications,
  prefs,
  requests,
  subscriptions,
  stats
};

/**
 * due to the generic nature of the api naming as well as the context of
 * usage, it is better to import all the methods as a whole
 * and use the object
 */
export default apiMethods;
