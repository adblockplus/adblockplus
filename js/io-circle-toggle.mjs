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

import IOElement from "./io-element";
import {$} from "./dom";

class IOCircleToggle extends IOElement
{
  static get observedAttributes()
  {
    return ["action", "checked", "disabled"];
  }

  static get booleanAttributes()
  {
    return ["checked", "disabled"];
  }

  attributeChangedCallback()
  {
    this.render();
  }

  created()
  {
    this.setState({checked: this.checked});
    this.setAttribute("tabindex", 0);
    this.addEventListener("click", this);
    this.addEventListener("keydown", this);
    $(".outer-circle", this).addEventListener("transitionend", this);
  }

  onclick()
  {
    if (!this.disabled)
    {
      this.checked = !this.checked;
    }
  }

  onkeydown(event)
  {
    switch (event.key)
    {
      case " ":
      case "Enter":
        this.onclick(event);
        break;
    }
  }

  ontransitionend(event)
  {
    if (event.propertyName === "transform" && !this.disabled)
    {
      const {checked} = this.state;
      if (checked !== this.checked)
      {
        this.setState({checked: this.checked}, false);
        $("svg", this).dispatchEvent(new CustomEvent("change", {
          bubbles: true,
          cancelable: true,
          detail: this.checked
        }));
      }
    }
  }

  render()
  {
    this.html`
    <svg
      width="100%"
      viewBox="-2.5 -2.5 71 50" version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      role="checkbox"
      data-action="${this.action}"
      aria-checked="${this.checked}"
      aria-disabled="${this.disabled}"
    >
      <g>
        <rect fill="#E4E4E4" x="1" y="16.8"
              width="64.4" height="12.6" rx="6.3" />
        <g transform="translate(31.6, 0)">
          <circle class="outer-circle" cx="23" cy="22.4" r="22.4" />
          <circle class="on" fill="#0688CB" cx="12" cy="22.4" r="9.8" />
          <circle class="off" fill="#4B4B4B" cx="-24" cy="22.4" r="9.8" />
        </g>
      </g>
    </svg>`;
  }
}

IOCircleToggle.define("io-circle-toggle");

export default IOCircleToggle;
