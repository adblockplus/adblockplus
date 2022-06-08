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

import api from "./api";
import {getErrorMessage} from "./common";
import {$} from "./dom";
import {stripTagsUnsafe} from "./i18n";
import IOElement from "./io-element";
import IOFilterBase from "./io-filter-base";

import "./io-checkbox";
import "./io-toggle";

const prevFilterText = new WeakMap();

// <io-filter-list disabled />.{filters = [...]}
class IOFilterList extends IOFilterBase
{
  get defaultState()
  {
    return Object.assign(super.defaultState, {
      sort: {
        current: "",
        asc: false
      },
      sortMap: {
        status: "disabled",
        rule: "text",
        warning: "slow"
      }
    });
  }

  created()
  {
    setupPort.call(this);
    super.created();
  }

  onheaderclick(event)
  {
    const th = event.target.closest("th");
    if (!IOElement.utils.event.isLeftClick(event) || !th)
      return;
    const {column} = th.dataset;
    if (column === "selected")
    {
      const ioCheckbox = event.target.closest("io-checkbox");
      // ignore clicks outside the io-checkbox
      if (ioCheckbox)
        this.selected = ioCheckbox.checked ? this.filters : [];
      return;
    }
    event.preventDefault();
    const {sort, sortMap} = this.state;
    if (column !== sort.current)
    {
      sort.current = column;
      sort.asc = false;
    }
    sort.asc = !sort.asc;
    const sorter = sort.asc ? 1 : -1;
    const property = sortMap[column];
    const direction = property === "slow" ? -1 : 1;
    this.filters.sort((fa, fb) =>
    {
      if (fa[property] === fb[property])
        return 0;
      return (fa[property] < fb[property] ? -sorter : sorter) * direction;
    });
    this.render();
    const dataset = th.closest("thead").dataset;
    dataset.sort = column;
    dataset.dir = sort.asc ? "asc" : "desc";
  }

  onpaste(event)
  {
    event.preventDefault();

    const data = event.clipboardData.getData("text/plain");
    // Filters must be written within a single line so we're ignoring any
    // subsequent lines in case clipboard data contains multiple lines.
    const [text] = data.trim().split("\n", 1);
    document.execCommand("insertText", false, text);
  }

  onkeydown(event)
  {
    const {key} = event;
    if (key === "Enter" || key === "Escape")
    {
      event.preventDefault();
      if (key === "Escape" && this._filter)
      {
        const {currentTarget} = event;
        const text = prevFilterText.get(this._filter) || this._filter.text;
        currentTarget.textContent = text;
        currentTarget.blur();
        this._filter = null;
      }
    }
  }

  onkeyup(event)
  {
    const isEnter = event.key === "Enter";
    const update = isEnter || event.type === "blur";
    const {currentTarget} = event;
    const {title} = currentTarget;
    const text = currentTarget.textContent.trim();
    const filter = this._filter;

    // if triggered but there was focus lost already: return
    if (!filter)
      return;

    // in case of empty filter, remove it
    if (!text)
    {
      if (!update)
        return;
      browser.runtime.sendMessage({
        type: "filters.remove",
        text: filter.text
      }).then(errors =>
      {
        if (!errors.length)
        {
          this.selected.delete(filter);
          this.render();
          this.dispatchEvent(new CustomEvent("filter:removed", {
            cancelable: false,
            bubbles: true
          }));
        }
      });
      this._filter = null;
      return;
    }

    // store the initial filter value once
    // needed to remove the filter once finished the editing
    if (!prevFilterText.has(filter))
      prevFilterText.set(filter, title);

    // avoid updating filters that didn't change
    if (prevFilterText.get(filter) === text)
    {
      if (isEnter)
        focusTheNextFilterIfAny.call(this, currentTarget.closest("tr"));
      return;
    }

    // add + remove the filter on Enter / update
    if (update)
    {
      filter.text = text;
      currentTarget.title = text;
      // drop any validation action at distance
      this._validating = 0;
      if (this.filters.some(f => f.text === filter.text && f !== filter))
      {
        const {reason} = filter;
        filter.reason = {type: "filter_duplicated"};

        // render only if there's something different to show
        if (!isSameError(filter.reason, reason))
        {
          this.render();
        }
      }
      else
      {
        replaceFilter.call(this, filter, currentTarget);
        if (isEnter)
          focusTheNextFilterIfAny.call(this, currentTarget.closest("tr"));
      }
      return;
    }

    // don't overload validation
    if (this._validating > 0)
    {
      // but signal there is more validation to do
      this._validating++;
      return;
    }
    this._validating = 1;
    browser.runtime.sendMessage({
      type: "filters.validate",
      text
    }).then(errors =>
    {
      // in case a save operation has been asked in the meanwhile
      if (this._validating < 1)
        return;
      // if there were more validation requests
      if (this._validating > 1)
      {
        // reset the counter
        this._validating = 0;
        // re-trigger the event with same target
        this.onkeyup({currentTarget});
        return;
      }
      const {reason} = filter;
      if (errors.length)
        filter.reason = errors[0];
      else
        delete filter.reason;
      // render only if there's something different to show
      if (!isSameError(filter.reason, reason))
        this.render();
    });
  }

  onfocus(event)
  {
    const {currentTarget} = event;
    this._filter = currentTarget.data;
    currentTarget.closest("tr").classList.add("editing");
  }

  onblur(event)
  {
    const {currentTarget} = event;
    currentTarget.closest("tr").classList.remove("editing");
    // needed to avoid ellipsis on overflow hidden
    // make the filter look like disappeared from the list
    currentTarget.scrollLeft = 0;
    if (this._changingFocus)
    {
      this._filter = null;
      return;
    }
    this.onkeyup(event);
    this._filter = null;
  }

  // used in the checkbox of the selected column only
  onclick(event)
  {
    const filter = getFilter(event);
    const {filters} = this;
    if (event.shiftKey && this.selected.size)
    {
      let start = filters.indexOf(this._lastFilter);
      const end = filters.indexOf(filter);
      const method = this.selected.has(this._lastFilter) ?
                          "add" :
                          "delete";
      if (start < end)
      {
        while (start++ < end)
          this.selected[method](filters[start]);
      }
      else
      {
        while (start-- > end)
          this.selected[method](filters[start]);
      }
    }
    else
    {
      this._lastFilter = filter;
      if (this.selected.has(filter))
        this.selected.delete(filter);
      else
        this.selected.add(filter);
    }
    // render updated right after the checkbox changes
  }

  // used in both selected and status
  // the selected needs it to render at the right time
  // which is when the checkbox status changed
  // not when it's clicked
  onchange(event)
  {
    const {currentTarget} = event;
    const td = currentTarget.closest("td");
    if (td.dataset.column === "status")
    {
      const checkbox = currentTarget.closest("io-toggle");
      const filter = getFilter(event);
      filter.disabled = !checkbox.checked;
      browser.runtime.sendMessage({
        type: "filters.toggle",
        text: filter.text,
        disabled: filter.disabled
      });
    }
    else
    {
      this.render();
    }
  }

  renderTable(visibleFilters)
  {
    const {length} = this.filters;
    this.html`<table cellpadding="0" cellspacing="0">
      <thead onclick="${this}" data-call="onheaderclick">
        <th data-column="selected">
          <io-checkbox ?checked=${!!length && this.selected.size === length} />
        </th>
        <th data-column="status"></th>
        <th data-column="rule">${{i18n: "options_filter_list_rule"}}</th>
        <th data-column="warning">${
          // for the header, just return always the same warning icon
          warnings.get(this) ||
          warnings.set(this, createImageForType(false)).get(this)
        }</th>
      </thead>
      <tbody>${visibleFilters.map(getRow, this)}</tbody>
      ${this.scrollbar}
    </table>`;
  }

  sortBy(type, isAscending)
  {
    const th = $(`th[data-column="${type}"]`, this);
    if (!th)
    {
      console.error(`unable to sort by ${type}`);
      return;
    }
    const {sort} = this.state;
    sort.current = type;
    // sort.asc is flipped with current state
    // so set the one that is not desired
    sort.asc = !isAscending;
    // before triggering the event
    th.click();
  }
}

IOFilterList.define("io-filter-list");

// Please note: the contenteditable=${...} attribute
// cannot be set directly to the TD because of an ugly
// MS Edge bug that does not allow TDs to be editable.
function getRow(filter, i)
{
  if (filter)
  {
    const selected = this.selected.has(filter);
    return IOElement.wire(filter)`
    <tr class="${selected ? "selected" : ""}">
      <td data-column="selected">
        <io-checkbox
          ?checked=${selected}
          onclick="${this}" onchange="${this}"
        />
      </td>
      <td data-column="status">
        <!-- Not all filters can be en-/disabled (e.g. comments) -->
        <io-toggle
          ?checked=${!filter.disabled}
          ?disabled=${!("disabled" in filter)}
          aria-hidden="${!("disabled" in filter)}"
          onchange="${this}"
        />
      </td>
      <td data-column="rule">
        <div
          class="content"
          contenteditable="${!this.disabled}"
          title="${filter.text}"
          onpaste="${this}"
          onkeydown="${this}"
          onkeyup="${this}"
          onfocus="${this}"
          onblur="${this}"
          data="${filter}"
        >${filter.text}</div>
      </td>
      <td data-column="warning">
        ${getWarning(filter)}
      </td>
    </tr>`;
  }
  // no filter results into an empty, not editable, row
  return IOElement.wire(this, `:${i}`)`
    <tr class="empty">
      <td data-column="selected"></td>
      <td data-column="status"></td>
      <td data-column="rule"></td>
      <td data-column="warning"></td>
    </tr>`;
}

// used to show issues in the last column
const issues = new WeakMap();

// used to show warnings in the last column
const warnings = new WeakMap();

// relate either issues or warnings to a filter
const createImageForFilter = (isIssue, filter) =>
{
  const error = (isIssue) ? filter.reason : {type: "filter_slow"};
  const image = createImageForType(isIssue);
  image.title = stripTagsUnsafe(getErrorMessage(error));
  return image;
};

const createImageForType = (isIssue) =>
{
  const image = new Image();
  image.src = `skin/icons/${isIssue ? "error" : "alert"}.svg`;
  return image;
};

function focusTheNextFilterIfAny(tr)
{
  const i = this.filters.indexOf(this._filter) + 1;
  if (i < this.filters.length)
  {
    const next = tr.nextElementSibling;
    const {rowHeight, scrollTop, viewHeight} = this.state;
    // used to avoid race conditions with blur event
    this._changingFocus = true;
    // force eventually the scrollTop to make
    // the next row visible
    if (next.offsetTop > viewHeight)
    {
      this.setState({
        scrollTop: getScrollTop(scrollTop + rowHeight)
      });
    }
    // focus its content field
    $(".content", next).focus();
    // set back the _changingFocus
    this._changingFocus = false;
  }
}

function animateAndDrop(target)
{
  target.addEventListener("animationend", dropSavedClass);
  target.classList.add("saved");
}

function dropSavedClass(event)
{
  const {currentTarget} = event;
  currentTarget.classList.remove("saved");
  currentTarget.removeEventListener(event.type, dropSavedClass);
}

function getFilter(event)
{
  const el = event.currentTarget;
  const div = $('td[data-column="rule"] > .content', el.closest("tr"));
  return div.data;
}

// ensure the number is always between 0 and a positive number
// specially handy when filters are erased and the viewHeight
// is higher than scrollHeight and other cases too
function getScrollTop(value, scrollHeight)
{
  const scrollTop = Math.max(
    0,
    Math.min(scrollHeight || Infinity, value)
  );
  // avoid division by zero gotchas
  return isNaN(scrollTop) ? 0 : scrollTop;
}

function getWarning(filter)
{
  let map;
  if (filter.reason)
  {
    map = issues;
  }
  else if (filter.slow)
  {
    map = warnings;
  }
  else
    return "";

  let warning = map.get(filter);
  if (warning)
    return warning;

  warning = createImageForFilter(map === issues, filter);
  map.set(filter, warning);
  return warning;
}

function isSameError(errorA = {}, errorB = {})
{
  return errorA.type === errorB.type && errorA.reason === errorB.reason;
}

function replaceFilter(filter, currentTarget)
{
  const {text} = filter;
  const old = prevFilterText.get(filter);
  // if same text, no need to bother the extension at all
  if (old === text)
  {
    animateAndDrop(currentTarget);
    return;
  }
  browser.runtime.sendMessage({
    type: "filters.replace",
    new: text,
    old
  }).then(errors =>
  {
    if (errors.length)
    {
      filter.reason = errors[0];
    }
    else
    {
      // see https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/issues/338
      // until that lands, we remove the filter and add it at the end
      // of the table so, before rendering, drop the new filter and update
      // the current known one
      const {filters} = this;
      let i = filters.length;
      let newFilter;
      while (i--)
      {
        newFilter = filters[i];
        if (newFilter.text === text)
          break;
      }
      filters.splice(i, 1);
      delete filter.disabled;
      delete filter.reason;
      Object.assign(filter, newFilter);
      prevFilterText.set(filter, text);
      animateAndDrop(currentTarget);
    }
    this.render();
  });
}

// listen to filters messages and eventually
// delegate the error handling
function setupPort()
{
  api.connect();
  api.addListener((message) =>
  {
    if (message.type === "filters.respond" && message.action === "changed")
    {
      const {text, disabled} = message.args[0];
      const filter = this.filters.find(f => f.text === text);

      if (!filter)
        return;

      const shownDisabled = filter.disabled;

      if (disabled !== shownDisabled)
      {
        filter.reason = {type: "filter_disabled"};
        filter.disabled = disabled;
      }
      this.render();
    }
  });
}

export default IOFilterList;
