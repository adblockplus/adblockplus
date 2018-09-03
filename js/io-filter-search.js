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

// this component simply emits filter:add(text)
// and filter:match({accuracy, filter}) events
class IOFilterSearch extends IOElement
{
  static get booleanAttributes()
  {
    return ["disabled"];
  }

  static get observedAttributes()
  {
    return ["match"];
  }

  get defaultState()
  {
    return {
      filterExists: true,
      filters: [],
      match: -1
    };
  }

  get filters()
  {
    return this.state.filters;
  }

  // filters are never modified or copied
  // but used to find out if one could be added
  // or if the component in charge should show the found one
  set filters(value)
  {
    this.setState({filters: value || []});
  }

  get match()
  {
    return this.state.match;
  }

  // match is a number between -1 and 1
  // -1 means any match
  // 1 means exact match
  // 0 means match disabled => no filter:match event ever
  set match(value)
  {
    this.setState({
      match: Math.max(-1, Math.min(1, parseFloat(value) || 0))
    }, false);
  }

  get value()
  {
    return $("input", this).value.trim();
  }

  set value(text)
  {
    const value = String(text || "").trim();
    $("input", this).value = value;
    this.setState({
      filterExists: value.length ?
                      this.state.filters.some(hasValue, value) :
                      false
    });
  }

  attributeChangedCallback(name, previous, current)
  {
    if (name === "match")
      this.match = current;
    else
      this.render();
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
    if (this.value)
      dispatch.call(this, "filter:add", this.value);
  }

  ondrop(event)
  {
    event.preventDefault();
    addFilter.call(this, event.dataTransfer.getData("text"));
  }

  onkeydown(event)
  {
    switch (event.key)
    {
      case "Enter":
        const {value} = this;
        if (
          value.length &&
          !this.disabled &&
          !this.state.filters.some(hasValue, value)
        )
          addFilter.call(this, value);
        break;
      case "Escape":
        this.value = "";
        break;
    }
  }

  onkeyup()
  {
    const {match, value} = this;
    // no match means don't validate
    // but also multi line (paste on old browsers)
    // shouldn't pass through this logic (filtered later on)
    if (!match || !value || value.includes("\n"))
      return;
    clearTimeout(this._timer);
    // debounce the search to avoid degrading
    // performance on very long list of filters
    this._timer = setTimeout(() =>
    {
      this._timer = 0;
      const result = search.call(this, value);
      if (result.accuracy && match <= result.accuracy)
        dispatch.call(this, "filter:match", result);
    }, 100);
  }

  onpaste(event)
  {
    const clipboardData = event.clipboardData || window.clipboardData;
    addFilter.call(this, clipboardData.getData("text"));
  }

  render()
  {
    const {disabled} = this;
    this.html`
    <input
      placeholder="${this._placeholder}"
      onkeydown="${this}" onkeyup="${this}"
      ondrop="${this}" onpaste="${this}"
      disabled="${disabled}"
    >
    <button
      onclick="${this}"
      disabled="${disabled || this.state.filterExists || !this.value}">
      + ${{i18n: "add"}}
    </button>`;
  }
}

IOFilterSearch.define("io-filter-search");

module.exports = IOFilterSearch;

function addFilter(data)
{
  const value = data.trim();
  if (!value)
    return;
  const result = search.call(this, value);
  if (result.accuracy < 1)
    dispatch.call(this, "filter:add", value);
  else if (result.accuracy)
    dispatch.call(this, "filter:match", result);
}

function dispatch(type, detail)
{
  this.dispatchEvent(new CustomEvent(type, {detail}));
}

function hasValue(filter)
{
  return filter.text == this;
}

function search(value)
{
  let accuracy = 0;
  let closerFilter = null;
  const searchLength = value.length;
  if (searchLength)
  {
    const match = this.match;
    const {filters} = this.state;
    const {length} = filters;
    for (let i = 0; i < length; i++)
    {
      const filter = filters[i];
      const filterLength = filter.text.length;
      // ignore all filters shorter than current search
      if (searchLength > filterLength)
        continue;
      // compare the two strings only if length is the same
      if (searchLength === filterLength)
      {
        if (filter.text === value)
        {
          closerFilter = filter;
          accuracy = 1;
          break;
        }
        continue;
      }
      // otherwise verify text includes searched value
      // only if the match is not meant to be 1:1
      if (match < 1 && filter.text.includes(value))
      {
        const tmpAccuracy = searchLength / filterLength;
        if (accuracy < tmpAccuracy)
        {
          closerFilter = filter;
          accuracy = tmpAccuracy;
        }
      }
    }
    this.setState({filterExists: accuracy === 1});
  }
  return {accuracy, filter: closerFilter};
}
