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

// create the tab object once at the right time
export const activeTab = new Promise(
  resolve =>
  {
    document.addEventListener("DOMContentLoaded", () =>
    {
      browser.tabs.query({active: true, lastFocusedWindow: true})
        .then((tabs) =>
        {
          const {id, incognito, url} = tabs[0];
          resolve({id, incognito, url});
        });
    }, {once: true});
  }
);

export function getDoclinks(notification)
{
  if (!notification.links)
    return Promise.resolve([]);

  return Promise.all(
    notification.links.map(link =>
    {
      return browser.runtime.sendMessage({
        type: "app.get",
        what: "doclink",
        link
      });
    })
  );
}

export function getPref(key)
{
  return browser.runtime.sendMessage({type: "prefs.get", key});
}

export function isTabAllowlisted(tab)
{
  return browser.runtime.sendMessage({type: "filters.isAllowlisted", tab});
}

export function reportIssue(tab)
{
  browser.tabs.create({
    active: false,
    url: browser.runtime.getURL("/issue-reporter.html?" + tab.id)
  }).then(
    // force closing popup which is not happening in Firefox
    // @link https://issues.adblockplus.org/ticket/7017
    () => window.close()
  );
}

export function setPref(key, value)
{
  return browser.runtime.sendMessage({type: "prefs.set", key, value});
}

export function togglePref(key)
{
  return browser.runtime.sendMessage({type: "prefs.toggle", key});
}

export function whenPageReady(tab)
{
  return new Promise(resolve =>
  {
    function onMessage(message, sender)
    {
      if (message.type == "composer.ready" && sender.page &&
          sender.page.id == tab.id)
      {
        browser.runtime.onMessage.removeListener(onMessage);
        resolve();
      }
    }

    browser.runtime.onMessage.addListener(onMessage);

    browser.runtime.sendMessage({
      type: "composer.isPageReady",
      pageId: tab.id
    }).then(ready =>
    {
      if (ready)
      {
        browser.runtime.onMessage.removeListener(onMessage);
        resolve();
      }
    });
  });
}
