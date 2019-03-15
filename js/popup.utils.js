"use strict";

// create the tab object once at the right time
const activeTab = new Promise(
  resolve =>
  {
    document.addEventListener("DOMContentLoaded", () =>
    {
      browser.tabs.query({active: true, lastFocusedWindow: true})
        .then((tabs) =>
        {
          resolve({id: tabs[0].id, url: tabs[0].url});
        });
    }, {once: true});
  }
);

function getDocLinks(notification)
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

function getPref(key)
{
  return browser.runtime.sendMessage({type: "prefs.get", key});
}

function isPageWhitelisted(tab)
{
  return browser.runtime.sendMessage({type: "filters.isWhitelisted", tab});
}

function reportIssue(tab)
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

function setPref(key, value)
{
  return browser.runtime.sendMessage({type: "prefs.set", key, value});
}

function togglePref(key)
{
  return browser.runtime.sendMessage({type: "prefs.toggle", key});
}

function whenPageReady(tab)
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

module.exports = {
  activeTab,
  getDocLinks,
  getPref,
  isPageWhitelisted,
  reportIssue,
  setPref,
  togglePref,
  whenPageReady
};
