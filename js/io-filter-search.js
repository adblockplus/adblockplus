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

const IOElement = require("./io-element");

const {$} = require("./dom");

const {boolean} = IOElement.utils;

// this component simply emits filter:add
// and filter:show events
class IOFilterSearch extends IOElement
{
  static get observedAttributes() { return ["disabled", "filters"]; }

  get defaultState() { return {filterExists: true, filters: []}; }

  get disabled() { return this.hasAttribute("disabled"); }

  set disabled(value)
  {
    boolean.attribute(this, "disabled", value);
    this.render();
  }

  get filters() { return this.state.filters; }

  // filters are never modified or copied
  // but used to find out if one could be added
  // or if the component in charge should show the found one
  set filters(value) { this.setState({filters: value || []}); }

  get value() { return $("input", this).value; }

  set value(text)
  {
    $("input", this).value = text || "";
    this.setState({
      filterExists: text ? this.state.filters.some(hasValue, text) : false
    });
  }

  created()
  {
    const {i18n} = browser;
    this._placeholder = i18n.getMessage("options_filters_search_or_add");
    this._timer = 0;
    this.render();
  }

  onclick()
  {
    dispatch.call(this, "filter:add", this.value);
  }

  onkeydown(event)
  {
    switch (event.key)
    {
      case "Enter":
        if (!this.state.filters.some(hasValue, this.value))
        {
          $("input", this).blur();
          this.onclick();
        }
        break;
      case " ":
        event.preventDefault();
        break;
    }
  }

  onkeyup(event)
  {
    clearTimeout(this._timer);
    // debounce the search to avoid degrading
    // performance on very long list of filters
    this._timer = setTimeout(() =>
    {
      this._timer = 0;
      const {value} = this;
      const filterExists = this.state.filters.some(hasValue, value);
      this.setState({filterExists});
      if (filterExists)
        dispatch.call(this, "filter:show", value);
    }, 100);
  }

  render()
  {
    const {disabled} = this;
    this.html`
    <input
      placeholder="${this._placeholder}"
      onkeydown="${this}" onkeyup="${this}"
      disabled="${disabled}"
    >
    <button
      onclick="${this}"
      disabled="${disabled || this.state.filterExists}">
      + ${{i18n: "add"}}
    </button>`;
  }
}

IOFilterSearch.define("io-filter-search");

function dispatch(type, detail)
{
  this.dispatchEvent(new CustomEvent(type, {detail}));
}

function hasValue(filter)
{
  return filter.rule == this;
}
