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

/* globals getDocLink */

"use strict";

{
  const {getMessage} = ext.i18n;

  const dialogSubscribe = "subscribe";
  const idAcceptableAds = "acceptableAds";
  const idRecommended = "subscriptions-recommended";
  let whitelistFilter = null;
  let promisedAcceptableAdsUrl = getAcceptableAdsUrl();

  /* Utility functions */

  function get(selector, origin)
  {
    return (origin || document).querySelector(selector);
  }

  function getAll(selector, origin)
  {
    return (origin || document).querySelectorAll(selector);
  }

  function create(parent, tagName, content, attributes, onclick)
  {
    let element = document.createElement(tagName);

    if (typeof content == "string")
    {
      element.textContent = content;
    }

    if (attributes)
    {
      for (let name in attributes)
      {
        element.setAttribute(name, attributes[name]);
      }
    }

    if (onclick)
    {
      element.addEventListener("click", (ev) =>
      {
        onclick(ev);
        ev.stopPropagation();
      });
    }

    parent.appendChild(element);
    return element;
  }

  /* Extension interactions */

  function getInstalled()
  {
    return new Promise((resolve, reject) =>
    {
      ext.backgroundPage.sendMessage(
        {type: "subscriptions.get", downloadable: true},
        resolve
      );
    });
  }

  function getAcceptableAdsUrl()
  {
    return new Promise((resolve, reject) =>
    {
      ext.backgroundPage.sendMessage(
        {type: "prefs.get", key: "subscriptions_exceptionsurl"},
        resolve
      );
    });
  }

  function getRecommendedAds()
  {
    return fetch("subscriptions.xml")
      .then((response) => response.text())
      .then((text) =>
      {
        let doc = new DOMParser().parseFromString(text, "application/xml");
        let elements = Array.from(doc.getElementsByTagName("subscription"));

        return elements
          .filter((element) => element.getAttribute("type") == "ads")
          .map((element) =>
          {
            return {
              title: element.getAttribute("title"),
              url: element.getAttribute("url")
            };
          });
      });
  }

  function installSubscription(url, title)
  {
    ext.backgroundPage.sendMessage({type: "subscriptions.add", url, title});
  }

  function uninstallSubscription(url)
  {
    ext.backgroundPage.sendMessage({type: "subscriptions.remove", url});
  }

  /* Actions */

  function setSubscription({disabled, title, url}, shouldAdd)
  {
    if (disabled)
      return;

    promisedAcceptableAdsUrl.then((acceptableAdsUrl) =>
    {
      if (url == acceptableAdsUrl)
      {
        get(`#${idAcceptableAds}`).checked = true;
        return;
      }

      let listInstalled = get("#subscriptions-installed");
      let installed = get(`[data-url="${url}"]`, listInstalled);

      if (installed)
      {
        let titleElement = get("span", installed);
        titleElement.textContent = title || url;
      }
      else if (shouldAdd)
      {
        let element = create(listInstalled, "li", null, {"data-url": url});
        create(element, "span", title || url);
        create(element, "button", null, {class: "remove"},
          () => uninstallSubscription(url)
        );

        let recommended = get(`#${idRecommended} [data-url="${url}"]`);
        if (recommended)
        {
          recommended.classList.add("installed");
        }
      }
    });
  }

  function removeSubscription(url)
  {
    promisedAcceptableAdsUrl.then((acceptableAdsUrl) =>
    {
      if (url == acceptableAdsUrl)
      {
        get(`#${idAcceptableAds}`).checked = false;
        return;
      }

      let installed = get(`#subscriptions-installed [data-url="${url}"]`);
      if (installed)
      {
        installed.parentNode.removeChild(installed);
      }

      let recommended = get(`#${idRecommended} [data-url="${url}"]`);
      if (recommended)
      {
        recommended.classList.remove("installed");
      }
    });
  }

  function setDialog(id, options)
  {
    if (!id)
    {
      delete document.body.dataset.dialog;
      return;
    }

    let fields = getAll(`#dialog-${id} input`);
    for (let field of fields)
    {
      let {name} = field;
      field.value = (options && name in options) ? options[name] : "";
    }
    setError(id, null);

    document.body.dataset.dialog = id;
  }

  function setError(dialogId, fieldName)
  {
    let dialog = get(`#dialog-${dialogId}`);
    if (fieldName)
    {
      dialog.dataset.error = fieldName;
    }
    else
    {
      delete dialog.dataset.error;
    }
  }

  function populateLists()
  {
    Promise.all([getInstalled(), getRecommendedAds()])
      .then(([installed, recommended]) =>
      {
        let listRecommended = get(`#${idRecommended}`);
        for (let {title, url} of recommended)
        {
          create(listRecommended, "li", title, {"data-url": url},
            (ev) =>
            {
              if (ev.target.classList.contains("installed"))
                return;

              setDialog(dialogSubscribe, {title, url});
            }
          );
        }

        for (let subscription of installed)
        {
          if (subscription.disabled)
            continue;

          setSubscription(subscription, true);
        }
      })
      .catch((err) => console.error(err));
  }

  /* Listeners */

  function onChange(ev)
  {
    if (ev.target.id != idAcceptableAds)
      return;

    promisedAcceptableAdsUrl.then((acceptableAdsUrl) =>
    {
      if (ev.target.checked)
      {
        installSubscription(acceptableAdsUrl, null);
      }
      else
      {
        uninstallSubscription(acceptableAdsUrl);
      }
    });
  }
  document.addEventListener("change", onChange);

  function toggleWhitelistFilter(toggle)
  {
    if (whitelistFilter)
    {
      ext.backgroundPage.sendMessage(
        {
          type: (toggle.checked) ? "filters.remove" : "filters.add",
          text: whitelistFilter
        },
        (errors) =>
        {
          if (errors.length < 1)
            return;

          console.error(errors);
          toggle.checked = !toggle.checked;
        }
      );
    }
    else
    {
      console.error("Whitelist filter hasn't been initialized yet");
    }
  }

  function onClick(ev)
  {
    switch (ev.target.dataset.action)
    {
      case "close-dialog":
        setDialog(null);
        break;
      case "open-dialog":
        setDialog(ev.target.dataset.dialog);
        break;
      case "toggle-enabled":
        toggleWhitelistFilter(ev.target);
        ev.preventDefault();
        break;
    }
  }
  document.addEventListener("click", onClick);

  function onSubmit(ev)
  {
    let fields = ev.target.elements;
    let title = fields.title.value;
    let url = fields.url.value;

    if (!title)
    {
      setError(dialogSubscribe, "title");
    }
    else if (!url)
    {
      setError(dialogSubscribe, "url");
    }
    else
    {
      installSubscription(url, title);
      setDialog(null);
    }

    ev.preventDefault();
  }
  document.addEventListener("submit", onSubmit);

  function onMessage(msg)
  {
    switch (msg.type)
    {
      case "app.respond": {
        switch (msg.action)
        {
          case "addSubscription":
            let [subscription] = msg.args;
            setDialog(dialogSubscribe, {
              title: subscription.title,
              url: subscription.url
            });
            break;
          case "showPageOptions":
            let [{host, whitelisted}] = msg.args;
            whitelistFilter = `@@||${host}^$document`;

            ext.i18n.setElementText(
              get("#enabled-label"),
              "mops_enabled_label",
              [host]
            );

            let toggle = get("#enabled");
            toggle.checked = !whitelisted;

            get("#enabled-container").hidden = false;
            break;
        }
        break;
      }
      case "filters.respond": {
        let [filter] = msg.args;
        if (!whitelistFilter || filter.text != whitelistFilter)
          break;

        get("#enabled").checked = (msg.action == "removed");
        break;
      }
      case "subscriptions.respond": {
        let [subscription] = msg.args;
        switch (msg.action)
        {
          case "added":
            setSubscription(subscription, true);
            break;
          case "disabled":
            if (subscription.disabled)
            {
              removeSubscription(subscription.url);
            }
            else
            {
              setSubscription(subscription, true);
            }
            break;
          case "removed":
            removeSubscription(subscription.url);
            break;
          case "title":
            // We're also receiving these messages for subscriptions that are
            // not installed so we shouldn't add those by accident
            setSubscription(subscription, false);
            break;
        }
        break;
      }
    }
  }
  ext.onMessage.addListener(onMessage);

  ext.backgroundPage.sendMessage({
    type: "app.listen",
    filter: ["addSubscription", "showPageOptions"]
  });

  ext.backgroundPage.sendMessage({
    type: "filters.listen",
    filter: ["added", "removed"]
  });

  ext.backgroundPage.sendMessage({
    type: "subscriptions.listen",
    filter: ["added", "disabled", "removed", "title"]
  });

  /* Initialization */

  populateLists();

  getDocLink("acceptable_ads", (link) =>
  {
    get("#acceptableAds-more").href = link;
  });

  get("#dialog-subscribe [name='title']").setAttribute(
    "placeholder",
    getMessage("mops_subscribe_title")
  );

  get("#dialog-subscribe [name='url']").setAttribute(
    "placeholder",
    getMessage("mops_subscribe_url")
  );
}
