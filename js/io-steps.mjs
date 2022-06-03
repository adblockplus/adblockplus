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

// a three steps example:
// <io-steps i18n-labels="first second third" />
class IOSteps extends IOElement
{
  static get observedAttributes()
  {
    return ["i18n-labels"];
  }

  created()
  {
    reset.call(this);
  }

  attributeChangedCallback()
  {
    // reset setup
    reset.call(this);
    // attributes can have spaces or new lines too
    for (const label of this.i18nLabels.split(/[\n ]+/))
    {
      const trimmed = label.trim();
      if (trimmed.length)
      {
        this.labels.push(browser.i18n.getMessage(trimmed));
      }
    }
    this.render();
  }

  // return the amount of enabled steps
  get enabled()
  {
    return this._enabled;
  }

  // return true or false accordingly if an index/step
  // has been already completed.
  getCompleted(index)
  {
    return index < this._enabled;
  }

  // set an index completed state
  // by default, completed is true
  setCompleted(index, completed = true)
  {
    if (index < 0)
      index = this.children.length + index;
    this.children[index].classList.toggle("completed", completed);
    if (
      completed &&
      index < this.labels.length &&
      this._enabled <= index
    )
    {
      this._enabled = index + 1;
      this.render();
    }
  }

  // dispatch a "step:click" event providing
  // the clicked index as event.detail property
  onclick(event)
  {
    event.preventDefault();
    event.stopPropagation();
    const indexOf = Array.prototype.indexOf;
    this.dispatchEvent(new CustomEvent("step:click", {
      bubbles: true,
      detail: indexOf.call(this.children, event.currentTarget)
    }));
  }

  render()
  {
    this.html`${this.labels.map(getButton, this)}`;
  }
}

const {wire} = IOElement;
function getButton(label, index)
{
  // each click dispatches change event
  // data-value is used to show the number
  return wire(this, `:${index}`)`
    <button
      onclick="${this}"
      disabled="${index > this._enabled}"
      data-value="${index + 1}"
    >${label}</button>`;
}

function reset()
{
  // amount of enabled lables, starts from at least one
  this._enabled = 0;
  // all the labels, passed as list
  this.labels = [];
}

IOSteps.define("io-steps");
