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

import {SessionStorage} from "./session.js";

/**
 * Session storage instance for storing tab-specific data.
 * @type {SessionStorage<number,any>}
 */
const sessionByTabId = new SessionStorage("_tabs");

/**
 * Session storage for storing tab-specific in-memory data in a way that's safe
 * to use in a service worker context.
 */
export class TabSessionStorage
{
  /**
   * Initializes session storage.
   * @param {string} namespace
   */
  constructor(namespace)
  {
    this._namespace = namespace;
  }

  /**
   * Deletes session storage content specific to given tab ID.
   * @param {number} tabId
   * @return {Promise}
   */
  async delete(tabId)
  {
    const session = await sessionByTabId.get(tabId);
    if (!session)
      return;

    delete session[this._namespace];

    if (Object.keys(session).length)
      await sessionByTabId.set(tabId, session);
    else
      await sessionByTabId.delete(tabId);
  }

  /**
   * Retrieves session storage content specific to given tab ID.
   * @param {number} tabId
   * @return {Promise<any>}
   */
  async get(tabId)
  {
    const session = await sessionByTabId.get(tabId);
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
    const session = await sessionByTabId.get(tabId);
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
    const session = (await sessionByTabId.get(tabId)) || {};
    session[this._namespace] = value;
    await sessionByTabId.set(tabId, session);
  }
}

/**
 * Initializes tab-specific session storage.
 */
function init()
{
  // Clear tab-specific data when the tab's content changes
  ext.pages.onLoading.addListener(async page =>
  {
    await sessionByTabId.delete(page.id);
  });

  // Clear tab-specific data when the tab gets removed
  ext.pages.onRemoved.addListener(async tabId =>
  {
    await sessionByTabId.delete(tabId);
  });
}
init();
