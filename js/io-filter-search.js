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

const MINIMUM_SEARCH_LENGTH = 3;

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
    this._addingFilter = false;
    this._timer = 0;
    this.render();
  }

  onclick()
  {
    if (this.value)
      addFilter.call(this, this.value);
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
        dispatch.call(this, "filter:none");
        this.value = "";
        break;
    }
  }

  onkeyup()
  {
    // clear timeout on any action
    clearTimeout(this._timer);

    // in case it was just added, don't do anything
    if (this._addingFilter)
    {
      this._addingFilter = false;
      return;
    }

    // debounce the search operations to avoid degrading
    // performance on very long list of filters
    this._timer = setTimeout(() =>
    {
      this._timer = 0;

      const {match, value} = this;
      // clear on backspace
      if (!value.length)
      {
        dispatch.call(this, "filter:none");
        this.value = "";
      }
      // do nothing when the search text is too small
      // also no match means don't validate
      // but also multi line (paste on old browsers)
      // shouldn't pass through this logic (filtered later on)
      else if (
        !match ||
        value.length < MINIMUM_SEARCH_LENGTH ||
        isMultiLine(value)
      )
      {
        this.setState({filterExists: this.state.filters.some(hasValue, value)});
        dispatch.call(this, "filter:none");
      }
      else
      {
        const result = search.call(this, value);
        if (result.accuracy && match <= result.accuracy)
          dispatch.call(this, "filter:match", result);
        else
          dispatch.call(this, "filter:none");
      }
    }, 100);
  }

  onpaste(event)
  {
    const clipboardData = event.clipboardData || window.clipboardData;
    const data = clipboardData.getData("text").trim();
    // do not automatically paste on single line
    if (isMultiLine(data))
      addFilter.call(this, data);
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
  dispatch.call(this, "filter:none");
  let value = data.trim();
  if (!value)
    return;

  // in case of multi line don't bother the search
  if (isMultiLine(value))
  {
    value = clearMultiLine(value);
    dispatch.call(this, "filter:add", value);
  }
  else
  {
    const result = search.call(this, value);
    if (result.accuracy < 1)
    {
      this._addingFilter = true;
      dispatch.call(this, "filter:add", value);
    }
    else if (result.accuracy && value.length >= MINIMUM_SEARCH_LENGTH)
      dispatch.call(this, "filter:match", result);
  }
}

function dispatch(type, detail)
{
  if (type === "filter:add" || this.filters.length)
    this.dispatchEvent(new CustomEvent(type, {detail}));
}

function hasValue(filter)
{
  return filter.text == this;
}

function clearMultiLine(data)
{
  return data.split(/[\r\n]/)
              .map(text => text.trim())
              .filter(text => text.length)
              .join("\n");
}

function isMultiLine(data)
{
  return /[\r\n]/.test(data.trim());
}

function search(value)
{
  let accuracy = 0;
  let closerFilter = null;
  const matches = [];
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
          matches.push(filter);
          closerFilter = filter;
          accuracy = 1;
        }
        continue;
      }
      // otherwise verify text includes searched value
      // only if the match is not meant to be 1:1
      if (match < 1 && filter.text.includes(value))
      {
        matches.push(filter);
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
  return {accuracy, matches, value, filter: closerFilter};
}
