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

require("./io-checkbox");
require("./io-toggle");

const IOElement = require("./io-element");
const IOScrollbar = require("./io-scrollbar");

const {utils, wire} = IOElement;

const {port} = require("./api");
const {$, events} = require("./dom");

const prevFilterText = new WeakMap();

port.postMessage({
  type: "filters.listen",
  filter: ["disabled"]
});

// <io-filter-list disabled />.{filters = [...]}
class IOFilterList extends IOElement
{
  static get booleanAttributes()
  {
    return ["disabled"];
  }

  static get observedAttributes()
  {
    return ["filters"];
  }

  get selected()
  {
    return this._selected || (this._selected = new Set());
  }

  set selected(value)
  {
    this._selected = new Set(value);
    this.render();
  }

  get defaultState()
  {
    return {
      infinite: false,
      filters: [],
      viewHeight: 0,
      rowHeight: 0,
      scrollTop: 0,
      scrollHeight: 0,
      tbody: null,
      sort: {
        current: "",
        asc: false
      },
      sortMap: {
        status: "disabled",
        rule: "text",
        warning: "slow"
      }
    };
  }

  get filters()
  {
    return this.state.filters || [];
  }

  set filters(value)
  {
    // if the offsetParent is null, hence the component is not visible, or
    // if the related CSS is not loaded yet, this component cannot bootstrap
    // because its TBODY will never be scrollable so there's no way
    // to calculate its viewport height in pixels
    // in such case, just execute later on until the CSS is parsed
    if (!this.ready)
    {
      this._filters = value;
      return;
    }
    this.selected = [];
    // clear any previous --rule-width info
    this.style.setProperty("--rule-width", "auto");
    // render one row only for the setup
    this.setState({infinite: false, filters: []});
    // set current flex grown rule column
    this.style.setProperty(
      "--rule-width",
      $('[data-column="rule"]', this).clientWidth + "px"
    );
    // if filters have more than a row
    // prepare the table with a new state
    if (value.length)
    {
      const tbody = $("tbody", this);
      const rowHeight = $("tr", tbody).clientHeight;
      const viewHeight = tbody.clientHeight;
      this.setState({
        infinite: true,
        filters: value,
        scrollTop: tbody.scrollTop,
        scrollHeight: rowHeight * (value.length + 1) - viewHeight,
        viewHeight,
        rowHeight
      });
      // needed mostly for Firefox and Edge to have extra rows
      // reflecting the same weight of others
      this.style.setProperty("--row-height", `${rowHeight}px`);
      // setup the scrollbar size too
      this.scrollbar.size = rowHeight * value.length;
    }
  }

  created()
  {
    setupPort.call(this);

    // force one off setup whenever the component enters the view
    if (!this.ready)
      this.addEventListener(
        "animationstart",
        function prepare(event)
        {
          this.removeEventListener(event.type, prepare);
          if (this._filters)
          {
            this.filters = this._filters;
            this._filters = null;
          }
        }
      );

    // the rest of the setup
    this.scrollbar = new IOScrollbar();
    this.scrollbar.direction = "vertical";
    this.scrollbar.addEventListener("scroll", () =>
    {
      const {position, range} = this.scrollbar;
      const {scrollHeight} = this.state;
      this.setState({
        scrollTop: getScrollTop(scrollHeight * position / range)
      });
    });
    this.addEventListener(
      "wheel",
      event =>
      {
        event.preventDefault();
        // prevent race conditions between the blur event and the scroll
        const activeElement = this.ownerDocument.activeElement;
        if (activeElement && activeElement !== this.ownerDocument.body)
        {
          activeElement.blur();
          return;
        }
        const {scrollHeight, scrollTop} = this.state;
        this.setState({
          scrollTop: getScrollTop(scrollTop + event.deltaY, scrollHeight)
        });
        // update the scrollbar position accordingly
        updateScrollbarPosition.call(this);
      },
      {passive: false}
    );
    setScrollbarReactiveOpacity.call(this);
  }

  scrollTo(row)
  {
    const {rowHeight, scrollHeight} = this.state;
    const index = typeof row === "string" ?
      this.filters.findIndex(filter => filter.text === row) :
      this.filters.findIndex(filter => filter === row);
    if (index < 0)
      console.error("invalid filter", row);
    else
    {
      this.setState({
        scrollTop: getScrollTop(index * rowHeight, scrollHeight)
      });
      updateScrollbarPosition.call(this);
    }
  }

  onheaderclick(event)
  {
    const th = event.target.closest("th");
    if (!utils.event.isLeftClick(event) || !th)
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
    const key = events.key(event);
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
    const isEnter = events.key(event) === "Enter";
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
        filter.reason = browser.i18n.getMessage("filter_duplicated");

        // render only if there's something different to show
        if (filter.reason !== reason)
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
      if (reason !== filter.reason)
        this.render();
    });
  }

  onfocus(event)
  {
    this._filter = event.currentTarget.data;
  }

  onblur(event)
  {
    // needed to avoid ellipsis on overflow hidden
    // make the filter look like disappeared from the list
    event.currentTarget.scrollLeft = 0;
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

  postRender(list)
  {
    const {tbody, scrollTop, rowHeight} = this.state;
    if (this.state.infinite)
    {
      tbody.scrollTop = scrollTop % rowHeight;
    }
    // keep growing the fake list until the tbody becomes scrollable
    else if (
      !tbody ||
      (tbody.scrollHeight <= tbody.clientHeight && tbody.clientHeight)
    )
    {
      this.setState({
        tbody: tbody || $("tbody", this),
        filters: list.concat({})
      });
    }
  }

  render()
  {
    let list = this.state.filters;
    if (this.state.infinite)
    {
      list = [];
      const {rowHeight, scrollTop, viewHeight} = this.state;
      const length = this.state.filters.length;
      let count = 0;
      let i = Math.floor(scrollTop / rowHeight);
      // always add an extra row to make scrolling smooth
      while ((count * rowHeight) < (viewHeight + rowHeight))
      {
        list[count++] = i < length ? this.state.filters[i++] : null;
      }
    }
    const {length} = this.filters;
    this.html`<table cellpadding="0" cellspacing="0">
      <thead onclick="${this}" data-call="onheaderclick">
        <th data-column="selected">
          <io-checkbox checked=${!!length && this.selected.size === length} />
        </th>
        <th data-column="status"></th>
        <th data-column="rule">${{i18n: "options_filter_list_rule"}}</th>
        <th data-column="warning">${
          // for the header, just return always the same warning icon
          warnings.get(this) ||
          warnings.set(this, createImageForType(false)).get(this)
        }</th>
      </thead>
      <tbody>${list.map(getRow, this)}</tbody>
      ${this.scrollbar}
    </table>`;
    this.postRender(list);
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

  updateScrollbar()
  {
    const {rowHeight, viewHeight} = this.state;
    const {length} = this.filters;
    this.scrollbar.size = rowHeight * length;
    this.setState({
      scrollHeight: rowHeight * (length + 1) - viewHeight
    });
  }
}

IOFilterList.define("io-filter-list");

module.exports = IOFilterList;

// delegates the handling of errors
function dispatchError(reason, filter)
{
  this.dispatchEvent(new CustomEvent("error", {
    cancelable: false,
    bubbles: true,
    detail: {
      reason,
      filter
    }
  }));
}

// Please note: the contenteditable=${...} attribute
// cannot be set directly to the TD because of an ugly
// MS Edge bug that does not allow TDs to be editable.
function getRow(filter, i)
{
  if (filter)
  {
    const selected = this.selected.has(filter);
    return wire(filter)`
    <tr class="${selected ? "selected" : ""}">
      <td data-column="selected">
        <io-checkbox
          checked="${selected}"
          onclick="${this}" onchange="${this}"
        />
      </td>
      <td data-column="status">
        <!-- Not all filters can be en-/disabled (e.g. comments) -->
        <io-toggle
          checked="${!filter.disabled}"
          disabled="${!("disabled" in filter)}"
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
  return wire(this, `:${i}`)`
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
const warningSlow = browser.i18n.getMessage("filter_slow");

// relate either issues or warnings to a filter
const createImageForFilter = (weakMap, filter) =>
{
  const isIssue = weakMap === issues;
  const image = createImageForType(isIssue);
  if (isIssue)
  {
    image.title = filter.reason ||
      browser.i18n.getMessage("filter_action_failed");
  }
  else
    image.title = warningSlow;
  weakMap.set(filter, image);
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
  if (typeof filter.reason === "string")
    return issues.get(filter) || createImageForFilter(issues, filter);
  if (filter.slow)
    return warnings.get(filter) || createImageForFilter(warnings, filter);
  return "";
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

function setScrollbarReactiveOpacity()
{
  // get native value for undefined opacity
  const opacity = this.scrollbar.style.opacity;
  // cache it once to never duplicate listeners
  const cancelOpacity = () =>
  {
    // store default opacity value back
    this.scrollbar.style.opacity = opacity;
    // drop all listeners
    document.removeEventListener("pointerup", cancelOpacity);
    document.removeEventListener("pointercancel", cancelOpacity);
  };
  // add listeners on scrollbaro pointerdown event
  this.scrollbar.addEventListener("pointerdown", () =>
  {
    this.scrollbar.style.opacity = 1;
    document.addEventListener("pointerup", cancelOpacity);
    document.addEventListener("pointercancel", cancelOpacity);
  });
}

// listen to filters messages and eventually
// delegate the error handling
function setupPort()
{
  port.onMessage.addListener((message) =>
  {
    if (message.type === "filters.respond" && message.action === "disabled")
    {
      const {text, disabled} = message.args[0];
      const filter = this.filters.find(f => f.text === text);
      if (filter && disabled !== filter.disabled)
      {
        filter.reason = browser.i18n.getMessage("filter_disabled");
        filter.disabled = disabled;
      }
      this.render();
    }
  });
}

function updateScrollbarPosition()
{
  const {scrollbar, state} = this;
  const {scrollHeight, scrollTop} = state;
  scrollbar.position = scrollTop * scrollbar.range / scrollHeight;
}
