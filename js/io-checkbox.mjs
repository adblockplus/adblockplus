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

import IOElement from "./io-element.mjs";

class IOCheckbox extends IOElement
{
  static get booleanAttributes()
  {
    return ["checked", "disabled"];
  }

  attributeChangedCallback(name)
  {
    if (!this.disabled && name === "checked")
    {
      this.dispatchEvent(new CustomEvent("change", {
        bubbles: true,
        cancelable: true,
        detail: this.checked
      }));
    }

    this.render();
  }

  created()
  {
    this.addEventListener("click", this);
    this.render();
  }

  onclick(event)
  {
    if (this.disabled)
    {
      return;
    }

    this.checked = !this.checked;
  }

  render()
  {
    this.html`
    <button
      role="checkbox"
      disabled="${this.disabled}"
      aria-checked="${this.checked}"
      aria-disabled="${this.disabled}"
    />`;
  }
}

IOCheckbox.define("io-checkbox");

export default IOCheckbox;
