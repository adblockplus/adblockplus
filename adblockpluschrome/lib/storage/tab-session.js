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

import browser from "webextension-polyfill";
import {EventEmitter} from "../events.js";
import {SessionStorage} from "./session.js";

// We need to keep track of all tab session storage instances so that we can
// notify them about tab changes. Since we cannot iterate through a WeakSet,
// and since WeakRef is not yet available in all supported browsers, this means
// that we're adding them into memory without removing them. As long as we only
// create instances only right when the extension loads, this should not create
// a memory leak though.
/**
 * List of known tab session storage instances.
 * @type {Set<TabSessionStorage>}
 */
const tabStorages = new Set();

/**
 * Session storage for storing tab-specific in-memory data in a way that's safe
 * to use in a service worker context.
 */
export class TabSessionStorage extends EventEmitter
{
  /**
   * Initializes session storage.
   * @param {string} namespace storage key
   * @param {boolean} localStorage Use local storage instead or session storage?
   */
  constructor(namespace, localStorage)
  {
    super();
    const key = "_tabs";
    this.sessionByTabId = localStorage ?
      new SessionStorage(key, browser.storage.local) :
      new SessionStorage(key);

    this._namespace = namespace;
    this._queue = Promise.resolve();
    tabStorages.add(this);
  }

  /**
   * Deletes session storage content specific to given tab ID.
   * @param {number} tabId
   * @return {Promise}
   */
  async delete(tabId)
  {
    const _this = this;
    return this.sessionByTabId.transaction(async() =>
    {
      const session = await _this.sessionByTabId.get(tabId);
      if (!session)
        return;

      delete session[this._namespace];

      if (Object.keys(session).length)
        await _this.sessionByTabId.set(tabId, session);
      else
        await _this.sessionByTabId.delete(tabId);
    });
  }

  /**
   * Emits session storage event relating to given tab ID.
   * @param {string} name
   * @param {number} tabId
   */
  async emit(name, tabId)
  {
    const session = await this.sessionByTabId.get(tabId);
    if (!session)
      return;

    super.emit(name, {
      tabId,
      value: session[this._namespace]
    });
  }

  /**
   * Retrieves session storage content specific to given tab ID.
   * @param {number} tabId
   * @return {Promise<any>}
   */
  async get(tabId)
  {
    const session = await this.sessionByTabId.get(tabId);
    if (!session)
      return;

    return session[this._namespace];
  }

  /**
   * Indicates whether session storage content exists specific to given tab ID.
   * @param {number} tabId
   * @return {Promise<boolean>}
   */
  async has(tabId)
  {
    const session = await this.sessionByTabId.get(tabId);
    return session && this._namespace in session;
  }

  /**
   * Sets session storage content specific to given tab ID.
   * @param {number} tabId
   * @param {any} value
   * @return {Promise}
   */
  async set(tabId, value)
  {
    const _this = this;
    return this.sessionByTabId.transaction(async() =>
    {
      const session = (await _this.sessionByTabId.get(tabId)) || {};
      session[this._namespace] = value;
      await _this.sessionByTabId.set(tabId, session);
    });
  }

  /**
   * Appends session storage content specific to given tab ID.
   * @param {number} tabId
   * @param {any} value
   * @return {Promise}
   */
  async append(tabId, value)
  {
    const _this = this;
    return this.sessionByTabId.transaction(async() =>
    {
      const session = (await _this.sessionByTabId.get(tabId)) || {};
      const values = session[this._namespace] || [];
      values.push(value);
      session[this._namespace] = values;
      await _this.sessionByTabId.set(tabId, session);
    });
  }

  /**
   * Executes given function as a transaction to avoid race conditions.
   * @param {Function} fn
   * @return {Promise}
   */
  async transaction(fn)
  {
    this._queue = this._queue
      // Necessary to avoid breakage of promise chain
      .catch(console.error)
      .then(fn);
    return this._queue;
  }
}

/**
 * Clears tab-specific data.
 * @param {number} tabId
 * @return {Promise}
 */
async function clearStorage(tabId)
{
  // Provide stored data to listeners before removing it
  for (const storage of tabStorages)
  {
    const session = await storage.get(tabId);
    if (session)
      await storage.emit("tab-removed", tabId);

    await storage.delete(tabId);
  }
}

/**
 * Initializes tab-specific session storage.
 */
export function start()
{
  // Clear tab-specific data when the tab's content changes
  ext.pages.onLoading.addListener(page =>
  {
    void clearStorage(page.id);
  });

  // Clear tab-specific data when the tab gets removed
  ext.pages.onRemoved.addListener(tabId =>
  {
    void clearStorage(tabId);
  });
}
