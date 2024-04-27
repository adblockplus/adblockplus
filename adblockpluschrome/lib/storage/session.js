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
 * In-memory storage for use outside of service worker context.
 * @type {Map<string,any>}
 */
const memoryStorage = new Map();

/**
 * Session storage for storing in-memory data in a way that's safe to use in
 * a service worker context.
 */
export class SessionStorage
{
  /**
   * Initializes session storage.
   * @param {string} namespace
   * @param {Object} storage
   */
  constructor(namespace, storage = browser.storage.session)
  {
    // When we're running in the context of a service worker,
    // we can no longer rely on in-memory storage.
    this._namespace = namespace;
    this._queue = Promise.resolve();
    this.storage = storage;
  }

  /**
   * Generates unique storage key for storing values globally for given key.
   * @param {string} key
   * @return {string}
   */
  _getGlobalKey(key)
  {
    return `session:${this._namespace}:${key}`;
  }

  /**
   * Deletes session storage entry for given key.
   * @param {string} key
   * @return {Promise}
   */
  async delete(key)
  {
    const globalKey = this._getGlobalKey(key);
    if (!this.storage)
      return memoryStorage.delete(globalKey);

    return this.storage.remove(globalKey);
  }

  /**
   * Retrieves session storage entry for given key.
   * @param {string} key
   * @return {Promise<any>}
   */
  async get(key)
  {
    const globalKey = this._getGlobalKey(key);
    if (!this.storage)
      return memoryStorage.get(globalKey);

    const storage = await this.storage.get(globalKey);
    return storage[globalKey];
  }

  /**
   * Sets session storage entry for given key.
   * @param {string} key
   * @param {any} value
   * @return {Promise}
   */
  async set(key, value)
  {
    const globalKey = this._getGlobalKey(key);
    if (!this.storage)
    {
      memoryStorage.set(globalKey, value);
      return;
    }

    await this.storage.set({[globalKey]: value});
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
