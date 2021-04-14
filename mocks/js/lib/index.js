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

"use strict";

const filterClasses = require("./filter-classes");
require("./filter-composer");
const filterNotifier = require("./filter-notifier");
const filterStorage = require("./filter-storage");
const hitLogger = require("./hit-logger");
const info = require("./info");
const matcher = require("./matcher");
const messaging = require("./messaging");
const notification = require("./notification");
const notificationHelper = require("./notification-helper");
const options = require("./options");
const prefs = require("./prefs");
const recommendations = require("./recommendations");
const requestBlocker = require("./request-blocker");
require("./stats");
const subscriptionClasses = require("./subscription-classes");
const subscriptionInit = require("./subscription-init");
const synchronizer = require("./synchronizer");
const utils = require("./utils");
require("./allowlisting");

const modules = {
  filterClasses,
  filterNotifier,
  filterStorage,
  hitLogger,
  info,
  matcher,
  messaging,
  notification,
  notificationHelper,
  options,
  prefs,
  recommendations,
  requestBlocker,
  subscriptionClasses,
  subscriptionInit,
  synchronizer,
  utils
};

window.require = function(module)
{
  return modules[module];
};

module.exports = modules;
