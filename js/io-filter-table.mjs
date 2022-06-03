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

import {getErrorMessage} from "./common";
import IOElement from "./io-element";
import IOFilterList from "./io-filter-list";
import IOFilterSearch from "./io-filter-search";

import {$, clipboard} from "./dom";

// io-filter-table is a basic controller
// used to relate the search and the list
class IOFilterTable extends IOElement
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
    return {filters: [], match: -1, ready: false};
  }

  created()
  {
    this._showing = null;
    this.search = this.appendChild(new IOFilterSearch());
    this.search.addEventListener(
      "filter:add",
      event => this.onFilterAdd(event)
    );
    this.search.addEventListener(
      "filter:match",
      event => this.onFilterMatch(event)
    );
    this.search.addEventListener(
      "filter:none",
      () =>
      {
        this.list.selected = [];
        this.updateFooter();
      }
    );
    this.list = this.appendChild(new IOFilterList());
    this.list.addEventListener(
      "filter:removed",
      event => this.onFilterRemoved(event)
    );
    this.footer = this.appendChild(IOElement.wire()`<div class="footer" />`);
    this.addEventListener("click", this);
    this.addEventListener("error", this);
    this.setState({ready: true});
  }

  attributeChangedCallback(name, prev, value)
  {
    if (name === "match")
      this.setState({match: value}, false);
    this.render();
  }

  get filters()
  {
    return this.state.filters;
  }

  set filters(value)
  {
    this.setState({filters: value});
  }

  get match()
  {
    return this.state.match;
  }

  set match(value)
  {
    this.setState({match: value});
  }

  onclick(event)
  {
    if (event.target.closest("io-checkbox"))
    {
      cleanErrors.call(this);
    }
  }

  onerror(event)
  {
    // force the footer to be visible since errors are shown there
    this.updateFooter();
    this.footer.classList.add("visible");
    const {errors} = event.detail;
    const footerError = $(".footer .error", this);

    const errorMessages = errors.map(getErrorMessage);
    IOElement.bind(footerError)`
      ${errorMessages.map(mssg => `<li>${mssg}</li>`)}`;
    footerError.removeAttribute("hidden");
  }

  onfooterclick(event)
  {
    const {classList} = event.currentTarget;
    switch (true)
    {
      case classList.contains("delete"):
        const resolve = [];
        for (const filter of this.list.selected)
        {
          this.list.selected.delete(filter);
          this.filters.splice(this.filters.indexOf(filter), 1);
          resolve.push(browser.runtime.sendMessage({
            type: "filters.remove",
            text: filter.text
          }));
        }
        Promise.all(resolve).then(
          () => updateList(this.list),
          (errors) => this.onerror({detail: {errors}})
        );
        cleanErrors.call(this);
        break;
      case classList.contains("copy"):
        const filters = [];
        for (const filter of this.list.selected)
        {
          filters.push(filter.text);
        }
        clipboard.copy(filters.join("\n"));
        break;
    }
  }

  onFilterAdd(event)
  {
    const filters = event.detail.split(/(?:\r\n|\n)/);

    cleanErrors.call(this);
    browser.runtime.sendMessage({
      type: "filters.importRaw",
      text: filters.join("\n")
    })
    .then(errors =>
    {
      if (!errors.length)
      {
        filters.reverse();
        let added = false;
        for (const text of filters)
        {
          // We don't treat filter headers like invalid filters,
          // instead we simply ignore them and don't show any errors
          // in order to allow pasting complete filter lists
          if (text[0] === "[")
            continue;

          added = true;
          const i = this.filters.findIndex(flt => flt.text === text);
          const [filter] = i < 0 ? [{text}] : this.filters.splice(i, 1);
          this.filters.unshift(filter);
        }

        this.search.value = "";
        if (!added)
          return;

        this.render();
        updateList(this.list);
        this.list.scrollTo(this.filters[0]);
        this.updateFooter();
      }
      else
      {
        this.onerror({detail: {errors}});
      }
    });
  }

  onFilterMatch(event)
  {
    const {accuracy, filter, matches} = event.detail;
    this.list.selected = matches;
    // scroll either to the exact match or the first close match
    this.list.scrollTo(accuracy === 1 ? filter : matches[0]);
    this.updateFooter();
  }

  onFilterRemoved()
  {
    cleanErrors.call(this);
    this.updateFooter();
  }

  render()
  {
    const {disabled} = this;
    const {filters, match, ready} = this.state;
    if (!ready || !filters.length)
      return;

    // update inner components setting filters
    // only if necessary
    this.search.disabled = disabled;
    this.search.match = match;
    if (this.search.filters !== filters)
      this.search.filters = filters;

    this.list.disabled = disabled;
    if (this.list.filters !== filters)
      this.list.filters = filters;

    this.updateFooter();
  }

  updateFooter()
  {
    const disabled = !this.list.selected.size;
    IOElement.bind(this.footer)`
      <button
        class="delete"
        onclick="${this}"
        disabled="${disabled}"
        data-call="onfooterclick"
      >${{i18n: "delete"}}</button>
      <button
        class="copy"
        onclick="${this}"
        disabled="${disabled}"
        data-call="onfooterclick"
      >${{i18n: "copy_selected"}}</button>
      <ul class="error" hidden></ul>
    `;
  }
}

IOFilterTable.define("io-filter-table");

function cleanErrors()
{
  const footerError = $(".footer .error", this);
  if (footerError)
  {
    footerError.setAttribute("hidden", true);
    IOElement.bind(footerError)``;
  }
  this.updateFooter();
}

function updateList(list)
{
  list.render();
  list.updateScrollbar();
}
