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

const IOToggle = require("./io-toggle");
const {boolean} = IOToggle.utils;

class IOBigToggle extends IOToggle
{
  static get observedAttributes()
  {
    return super.observedAttributes.concat("refresh");
  }

  get refresh()
  {
    return this.hasAttribute("refresh");
  }

  set refresh(value)
  {
    boolean.attribute(this, "refresh", value);
  }

  onclick(event)
  {
    if (!this.disabled)
    {
      if (this.refresh)
      {
        this.dispatchEvent(new CustomEvent("refresh", {
          bubbles: true,
          cancelable: true,
          detail: this.checked
        }));
      }
      else
      {
        super.onclick(event);
      }
    }
  }

  render()
  {
    this.html`
    <button
      role="checkbox"
      disabled="${this.disabled}"
      data-action="${this.action}"
      aria-checked="${this.checked}"
      aria-disabled="${this.disabled}"
    >
      <span>${{i18n: "options_refresh"}}</span>
    </button>`;
  }
}

IOBigToggle.define("io-big-toggle");
