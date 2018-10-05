"use strict";

function getDocLinks(notification)
{
  if (!notification.links)
    return Promise.resolve([]);

  return Promise.all(
    notification.links.map(link =>
    {
      return new Promise((resolve, reject) =>
      {
        browser.runtime.sendMessage({
          type: "app.get",
          what: "doclink",
          link
        }, resolve);
      });
    })
  );
}

function getPref(key, callback)
{
  browser.runtime.sendMessage({type: "prefs.get", key}, callback);
}

function isPageWhitelisted(tab, callback)
{
  browser.runtime.sendMessage({type: "filters.isWhitelisted", tab}, callback);
}

function reportIssue(tab)
{
  browser.tabs.create({
    active: false,
    url: browser.runtime.getURL("/issue-reporter.html?" + tab.id)
  }).then(
    // force closing popup which is not happening in Firefox
    () => window.close()
  );
}

function setPref(key, value, callback)
{
  browser.runtime.sendMessage({type: "prefs.set", key, value}, callback);
}

function togglePref(key, callback)
{
  browser.runtime.sendMessage({type: "prefs.toggle", key}, callback);
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
    },
    ready =>
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
  getDocLinks,
  getPref,
  isPageWhitelisted,
  reportIssue,
  setPref,
  togglePref,
  whenPageReady
};
