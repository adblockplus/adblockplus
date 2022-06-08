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

import {bind, wire} from "hyperhtml";

import api from "../api";
import {convertDoclinks} from "../common";
import {$} from "../dom";
import {initI18n} from "../i18n";

// We need to import io-element to initialize the i18n intent we're using
import "../io-element";
import "../landing";

api.connect();
const localeInfo = api.app.get("localeInfo");

async function addUpdates(container, updates)
{
  const [appLanguage, appRegion] = (await localeInfo).locale.split("-");

  updates = updates.filter(({exceptions}) =>
  {
    if (!exceptions)
      return true;

    const {locales} = exceptions;

    if (locales)
    {
      for (const locale of locales)
      {
        const [language, region] = locale.split("-");

        if (
          language === appLanguage &&
          (!region || region === appRegion)
        )
          return false;
      }
    }

    return true;
  });

  if (!updates.length)
  {
    container.hidden = true;
    return;
  }

  const items = updates.map((update) =>
  {
    let link = null;
    if (update.doclink)
    {
      link = wire()`<p>
        <a href="#" target="_blank">
          ${{i18n: "updates_link"}}
        </a>
      </p>`;
      api.doclinks.get(update.doclink).then((url) =>
      {
        $("a", link).href = url;
      });
    }

    let media = null;
    if (update.image)
    {
      media = wire()`<img
        src="${update.image.url}"
        alt="${browser.i18n.getMessage(`updates_update_${update.id}_image`)}">`;
    }
    else if (update.video)
    {
      const videoDescription = `updates_update_${update.id}_video`;
      media = wire()`<video
        autoplay loop muted
        aria-label="${browser.i18n.getMessage(videoDescription)}">
        <source src="${update.video.url}" type="${update.video.type}">
        </source>
      </video>`;

      // "muted" attribute in some scenarios doesn't work in Firefox,
      // explicitely muting using JavaScript seem to fix it.
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1588360
      media.muted = true;
      const fallback = wire()`<div class="fallback">
        ${{i18n: videoDescription}}
      </div>`;
      media.addEventListener("error", () =>
      {
        media.parentElement.replaceChild(fallback, media);
      }, true);
    }

    return wire()`<li>
      <h3>${{i18n: `updates_update_${update.id}_title`}}</h3>
      <p>${{i18n: `updates_update_${update.id}_description`}}</p>
      ${link}
      ${media}
    </li>`;
  });

  const list = $(".updates", container);
  bind(list)`${items}`;
}

function initUpdates()
{
  fetch("data/updates.json")
  .then((resp) => resp.json())
  .then((updates) =>
  {
    $("#hero > img").src = updates.title.image;
    addUpdates($("#improvements"), updates.improvements);
    addUpdates($("#fixes"), updates.fixes);
  });
}

function initVersion()
{
  api.app.get("addonVersion").then((addonVersion) =>
  {
    $("#version").textContent = `v${addonVersion}`;
  });
}

function initContribute()
{
  api.app.getInfo().then(({store}) =>
  {
    document.body.dataset.store = store;
    let contributeSubtitleId = "updates_contribute_subtitle";
    if (store === "edge")
      contributeSubtitleId = "updates_contribute_subtitle_generic";

    const contributeSubtitle = browser.i18n.getMessage(contributeSubtitleId);
    $("#contribute-subtitle").textContent = contributeSubtitle;
    api.doclinks.get(`${store}_review`).then((url) =>
    {
      $("#contribute-rate a").href = url;
    });
  });
}

function load()
{
  convertDoclinks();
  initI18n();
  initContribute();
  initUpdates();
  initVersion();
}

load();
