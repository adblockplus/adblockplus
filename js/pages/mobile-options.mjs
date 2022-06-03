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

import {convertDoclinks, getDoclink, getErrorMessage} from "../common";
import {initI18n} from "../i18n";

{
  const dialogSubscribe = "subscribe";
  const idAcceptableAds = "acceptableAds";
  const idRecommended = "subscriptions-recommended";
  const promisedAcceptableAdsUrl = getAcceptableAdsUrl();
  let allowlistFilter = null;

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
    const element = document.createElement(tagName);

    if (typeof content == "string")
    {
      element.textContent = content;
    }

    if (attributes)
    {
      for (const name in attributes)
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
    return browser.runtime.sendMessage({type: "subscriptions.get"});
  }

  function getAcceptableAdsUrl()
  {
    return browser.runtime.sendMessage(
      {type: "app.get", what: "acceptableAdsUrl"});
  }

  function getRecommendedAds()
  {
    return browser.runtime.sendMessage({
      type: "app.get",
      what: "recommendations"
    })
    .then((recommendations) =>
    {
      return recommendations
        .filter((recommendation) => recommendation.type == "ads")
        .map((recommendation) =>
        {
          return {
            title: recommendation.title,
            url: recommendation.url
          };
        });
    });
  }

  function installSubscription(url, title)
  {
    browser.runtime.sendMessage({type: "subscriptions.add", url, title});
  }

  function uninstallSubscription(url)
  {
    browser.runtime.sendMessage({type: "subscriptions.remove", url});
  }

  /* Actions */

  function setFilter({disabled, text}, action)
  {
    if (!allowlistFilter || text != allowlistFilter)
      return;

    get("#enabled").checked = (action == "remove" || disabled);
  }

  function setSubscription(subscription, action)
  {
    const {disabled, filters, title, url} = subscription;
    if (disabled)
    {
      action = "remove";
    }

    // Handle custom subscription
    if (/^~user/.test(url))
    {
      for (const filter of filters)
      {
        setFilter(filter, action);
      }
      return;
    }

    promisedAcceptableAdsUrl.then((acceptableAdsUrl) =>
    {
      // Update Acceptable Ads
      if (url == acceptableAdsUrl)
      {
        get(`#${idAcceptableAds}`).checked = (action != "remove");
        return;
      }

      const listInstalled = get("#subscriptions-installed");
      const installed = get(`[data-url="${url}"]`, listInstalled);

      // Remove subscription
      if (action == "remove")
      {
        if (installed)
        {
          installed.parentNode.removeChild(installed);
        }

        const recommended = get(`#${idRecommended} [data-url="${url}"]`);
        if (recommended)
        {
          recommended.classList.remove("installed");
        }
      }
      // Update subscription
      else if (installed)
      {
        const titleElement = get("span", installed);
        titleElement.textContent = title || url;
      }
      // Add subscription
      else if (action == "add")
      {
        const element = create(listInstalled, "li", null, {"data-url": url});
        create(element, "span", title || url);
        create(
          element, "button", null, {class: "remove"},
          () => uninstallSubscription(url)
        );

        const recommended = get(`#${idRecommended} [data-url="${url}"]`);
        if (recommended)
        {
          recommended.classList.add("installed");
        }
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

    const fields = getAll(`#dialog-${id} input`);
    for (const field of fields)
    {
      const {name} = field;
      field.value = (options && name in options) ? options[name] : "";
    }
    setError(id, null);

    document.body.dataset.dialog = id;
  }

  function setError(dialogId, fieldName)
  {
    const dialog = get(`#dialog-${dialogId}`);
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
        const listRecommended = get(`#${idRecommended}`);
        for (const {title, url} of recommended)
        {
          create(
            listRecommended, "li", title, {"data-url": url},
            (ev) =>
            {
              if (ev.target.classList.contains("installed"))
                return;

              setDialog(dialogSubscribe, {title, url});
            }
          );
        }

        for (const subscription of installed)
        {
          if (subscription.disabled)
            continue;

          setSubscription(subscription, "add");
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

  function toggleAllowlistFilter(toggle)
  {
    if (allowlistFilter)
    {
      browser.runtime.sendMessage(
        {
          type: (toggle.checked) ? "filters.remove" : "filters.add",
          text: allowlistFilter
        }
      ).then(errors =>
      {
        if (errors.length < 1)
          return;

        console.error(getErrorMessage(errors[0]));
        toggle.checked = !toggle.checked;
      });
    }
    else
    {
      console.error("Allowlist filter hasn't been initialized yet");
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
        toggleAllowlistFilter(ev.target);
        ev.preventDefault();
        break;
    }
  }
  document.addEventListener("click", onClick);

  function onSubmit(ev)
  {
    const fields = ev.target.elements;
    const title = fields.title.value;
    const url = fields.url.value;

    if (!url)
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
            const [subscription] = msg.args;

            let {title, url} = subscription;
            if (!title || title == url)
            {
              title = "";
            }

            setDialog(dialogSubscribe, {title, url});
            break;
          case "showPageOptions":
            const [{host, allowlisted}] = msg.args;
            allowlistFilter = `@@||${host}^$document`;
            get("#enabled-domain").textContent = host;
            const toggle = get("#enabled");
            toggle.checked = !allowlisted;

            get("#enabled-container").hidden = false;
            break;
        }
        break;
      }
      case "filters.respond": {
        const action = (msg.action == "added") ? "add" : "remove";
        setFilter(msg.args[0], action);
        break;
      }
      case "subscriptions.respond": {
        const [subscription, property] = msg.args;
        switch (msg.action)
        {
          case "added":
            setSubscription(subscription, "add");
            break;
          case "changed":
            setSubscription(
              subscription,
              // We're also receiving these messages for subscriptions that are
              // not installed so we shouldn't add those by accident
              (property === "enabled") ? "add" : "update"
            );
            break;
          case "removed":
            setSubscription(subscription, "remove");
            break;
        }
        break;
      }
    }
  }

  const port = browser.runtime.connect({name: "ui"});
  port.onMessage.addListener(onMessage);

  port.postMessage({
    type: "app.listen",
    filter: ["addSubscription", "showPageOptions"]
  });

  port.postMessage({
    type: "filters.listen",
    filter: ["added", "removed"]
  });

  port.postMessage({
    type: "subscriptions.listen",
    filter: ["added", "changed", "removed"]
  });

  /* Initialization */

  convertDoclinks();
  initI18n();
  populateLists();

  getDoclink("privacy").then((url) =>
  {
    get("#privacy-policy").href = url;
  });
  getDoclink("imprint").then((url) =>
  {
    get("#imprint").href = url;
  });
}
