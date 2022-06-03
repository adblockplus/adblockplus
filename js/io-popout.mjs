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

import {getDoclink} from "./common";
import {setElementLinks} from "./i18n";
import IOElement from "./io-element";

class IOPopout extends IOElement
{
  static get observedAttributes()
  {
    return ["anchor-icon", "expanded", "i18n-body", "i18n-doclinks", "type"];
  }

  created()
  {
    this._children = Array.from(this.children);
    this.addEventListener("blur", this);
    this.addEventListener("click", this);
    this.setAttribute("tabindex", 0);
  }

  attributeChangedCallback()
  {
    this.render();
  }

  onblur(ev)
  {
    if (ev.relatedTarget && this.contains(ev.relatedTarget))
      return;

    this.expanded = null;
  }

  onclick(ev)
  {
    const {target} = ev;

    if (target.classList.contains("wrapper"))
    {
      ev.preventDefault();

      if (this.expanded)
      {
        this.expanded = null;
      }
      else if (this.type == "dialog" || this.type == "tooltip")
      {
        const {bottom, top} = ev.target.getBoundingClientRect();
        const {clientHeight} = document.documentElement;
        this.expanded = (clientHeight - bottom > top) ? "below" : "above";
      }
      else
      {
        this.expanded = "start";
      }
    }
    else if (target.nodeName == "A" || target.nodeName == "BUTTON")
    {
      this.expanded = null;
    }
  }

  render()
  {
    const {wire} = IOPopout;

    const role = this.type || "tooltip";
    const content = [];

    if (role == "dialog" || role == "tooltip")
    {
      content.push(wire(this, ":close")`
        <button class="icon close secondary"></button>
      `);
    }

    if (this.i18nBody)
    {
      const body = wire(this, ":body")`
        <p>${{i18n: this.i18nBody}}</p>
      `;

      // Support for link elements in the body is given through the mapping
      // of comma-separated values of `i18n-doclinks` popout dataset property
      // and the corresponding indexed anchor descendants.
      const {i18nDoclinks} = this.dataset;
      if (i18nDoclinks)
      {
        Promise.all(i18nDoclinks.split(",").map(getDoclink)).then(links =>
        {
          setElementLinks(body, ...links);
        });
      }

      content.push(body);
    }

    content.push(...this._children);

    this.html`
    <div class="wrapper icon">
      <div role="${role}" aria-hidden="${!this.expanded}">
        ${content}
      </div>
    </div>
    `;
  }
}

IOPopout.define("io-popout");
