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

function send(type, args)
{
  return browser.runtime.sendMessage({
    ...args,
    type
  });
}

const app = {
  get: (what) => send("app.get", {what}),
  getInfo,
  open: (what) => send("app.open", {what})
};

const doclinks = {
  get: (link) => send("app.get", {what: "doclink", link})
};

const filters = {
  get: () => send("filters.get")
};

const notifications = {
  get: (displayMethod) => send("notifications.get", {displayMethod}),
  seen: () => send("notifications.seen")
};

const prefs = {
  get: (key) => send("prefs.get", {key})
};

const subscriptions = {
  get: (options) => send("subscriptions.get", options),
  getInitIssues: () => send("subscriptions.getInitIssues")
};

const stats = {
  getBlockedPerPage: (tab) => send("stats.getBlockedPerPage", {tab}),
  getBlockedTotal: () => send("stats.getBlockedTotal")
};

// For now we are merely reusing the port for long-lived communications to fix
// https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/issues/415
const port = browser.runtime.connect({name: "ui"});

const apiMethods = {
  app,
  doclinks,
  filters,
  notifications,
  port,
  prefs,
  subscriptions,
  stats
};

/**
 * due to the generic nature of the api naming as well as the context of
 * usage, it is better to import all the methods as a whole
 * and use the object
 */
export default apiMethods;
