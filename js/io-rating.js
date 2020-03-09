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

const api = require("./api");
const IOElement = require("./io-element");

class IORating extends IOElement
{
  static get observedAttributes()
  {
    return ["store"];
  }

  attributeChangedCallback()
  {
    this.render();
  }

  created()
  {
    this.render();
  }

  onclick(event)
  {
    const rating = parseInt(event.target.dataset.rating, 10);
    let doclink = `${this.store}_review`;
    if (rating < 4)
    {
      doclink += "_low";
    }

    api.doclinks.get(doclink).then((url) =>
    {
      browser.tabs.create({url});
    });
  }

  render()
  {
    if (!this.store)
      return;

    this.html`
      <img data-rating="1" src="skin/icons/star.svg" onclick="${this}">
      <img data-rating="2" src="skin/icons/star.svg" onclick="${this}">
      <img data-rating="3" src="skin/icons/star.svg" onclick="${this}">
      <img data-rating="4" src="skin/icons/star.svg" onclick="${this}">
      <img data-rating="5" src="skin/icons/star.svg" onclick="${this}">
    `;
  }
}

IORating.define("io-rating");

module.exports = IORating;
