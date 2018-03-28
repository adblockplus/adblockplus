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

// used to create options
const {wire} = IOElement;

// used to map codes cross browser
const KeyCode = {
  ARROW_DOWN: "ArrowDown",
  ARROW_UP: "ArrowUp",
  BACKSPACE: "Backspace",
  DELETE: "Delete",
  ENTER: "Enter",
  ESCAPE: "Escape",
  END: "End",
  HOME: "Home",
  PAGE_DOWN: "PageDown",
  PAGE_UP: "PageUp",
  SPACE: " ",
  TAB: "Tab"
};

class IOListBox extends IOElement
{
  static get observedAttributes()
  {
    return ["action", "disabled", "expanded", "items", "placeholder"];
  }

  created()
  {
    this._blurTimer = 0;
    this._bootstrap = true;
    this._selected = {};
    this._text = this.textContent.trim();
    // in case the component has been addressed and
    // it has already an attached items property
    if (this.hasOwnProperty("items"))
    {
      const items = this.items;
      delete this.items;
      this.items = items;
    }
  }

  // shortcuts to retrieve sub elements
  get label()
  {
    return this.querySelector(`#${this.id}label`);
  }

  get popup()
  {
    return this.querySelector(`#${this.id}popup`);
  }

  // component status
  get disabled()
  {
    return this.hasAttribute("disabled");
  }

  set disabled(value)
  {
    IOElement.utils.boolean.attribute(this, "disabled", value);
    this.render();
  }

  get expanded()
  {
    return this.hasAttribute("expanded");
  }

  set expanded(value)
  {
    IOElement.utils.boolean.attribute(this, "expanded", value);
    this.render();
  }

  // items handler
  get items()
  {
    return this._items;
  }

  set items(items)
  {
    this._items = items;
    this.render();
    // WAI-ARIA guidelines:
    //  If an option is selected before the listbox receives focus,
    //  focus is set on the selected option.
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // if no items were passed, clean up
    // and bootstrap the next time.
    // The bootstrap will focus the right item.
    if (!items.length)
    {
      this._bootstrap = true;
    }
    // if it needs to bootstrap (cleanup or new component)
    else if (this._bootstrap)
    {
      this._bootstrap = false;
      for (const item of items)
      {
        // if an item is selected
        if (this._selected[getID(item)])
        {
          // simulate hover it and exit
          hover.call(this, item);
          return;
        }
      }
      // if no item was selected, hover the first one
      hover.call(this, items[0]);
    }
  }

  // events related methods
  handleEvent(event)
  {
    if (!this.disabled)
    {
      this[`on${event.type}`](event);
    }
  }

  // label related events
  onblur(event)
  {
    // ensure blur won't close the list right away or it's impossible
    // to get the selected raw on click (bad target)
    this._blurTimer = setTimeout(() => this.expanded = false, 200);
  }

  onfocus(event)
  {
    // if 0 or already cleared, nothing happens, really
    clearTimeout(this._blurTimer);
    // show the popup
    this.expanded = true;
  }

  onkeydown(event)
  {
    const hovered = this.querySelector(".hover");
    switch (event.key)
    {
      case KeyCode.BACKSPACE:
      case KeyCode.DELETE:
        event.preventDefault();
        break;
      /* both SPACE, RETURN and ESC hide and blur */
      case KeyCode.ENTER:
      case KeyCode.SPACE:
        hovered.dispatchEvent(new CustomEvent("click", {bubbles: true}));
        /* eslint: fall through */
      case KeyCode.ESCAPE:
        this.expanded = false;
        event.preventDefault();
        break;
      case KeyCode.ARROW_UP:
        const prev = findNext.call(
          this,
          hovered, "previousElementSibling"
        );
        if (prev)
          hover.call(this, getItem.call(this, prev.id));
        event.preventDefault();
        break;
      case KeyCode.ARROW_DOWN:
        const next = findNext.call(
          this,
          hovered, "nextElementSibling"
        );
        if (next)
          hover.call(this, getItem.call(this, next.id));
        event.preventDefault();
        break;
    }
  }

  // popup related events
  onclick(event)
  {
    if (!IOElement.utils.event.isLeftClick(event))
      return;
    event.preventDefault();
    clearTimeout(this._blurTimer);
    const query = '[role="option"]:not([aria-disabled="true"])';
    const el = event.target.closest(query);
    if (el)
    {
      this.expanded = false;
      this._selected[el.id] = !this._selected[el.id];
      this.render();
      this.dispatchEvent(new CustomEvent("change", {
        detail: getItem.call(this, el.id)
      }));
    }
  }

  onmouseover(event)
  {
    const el = event.target.closest('[role="option"]');
    if (el && !el.classList.contains("hover"))
      hover.call(this, this._items.find(item => getID(item) === el.id));
  }

  // the view
  render()
  {
    this.html`
    <button
      role="combobox"
      aria-readonly="true"
      id="${this.id + "label"}"
      disabled="${this.disabled}"
      data-action="${this.action}"
      aria-owns="${this.id + "popup"}"
      aria-disabled="${this.disabled}"
      aria-expanded="${this.expanded}"
      aria-haspopup="${this.id + "popup"}"
      onblur="${this}" onfocus="${this}" onkeydown="${this}"
    >${this.expanded ? this.placeholder : this._text}</button>
    <ul
      role="listbox"
      tab-index="-1"
      id="${this.id + "popup"}"
      aria-labelledby="${this.id + "label"}"
      hidden="${!this.expanded}"
      onclick="${this}" onmouseover="${this}"
    >${this._items.map(item =>
    {
      const id = getID(item);
      if (!this._selected.hasOwnProperty(id))
      {
        this._selected[id] = false;
      }
      return wire(this, `html:${id}`)`
      <li
        id="${id}"
        role="option"
        aria-disabled="${!item.disabled}"
        aria-selected="${this._selected[id]}"
      >${item.value}</li>`;
    })}</ul>`;
  }
}

IOListBox.define("io-list-box");

// to retrieve a unique ID per item
function getID(item)
{
  // get a unique URL for each known item
  return `li-${item.url.split("").map(
    c => c.charCodeAt(0).toString(32)
  ).join("")}`;
}

// to retrieve an item from an option id
function getItem(id)
{
  return this._items.find(item => getID(item) === id);
}

// private helper
function hover(item)
{
  const id = getID(item);
  const hovered = this.querySelector(".hover");
  if (hovered)
    hovered.classList.remove("hover");
  const option = this.querySelector(`#${id}`);
  option.classList.add("hover");
  this.label.setAttribute("aria-activedescendant", id);
  const popup = this.popup;
  if (popup.scrollHeight > popup.clientHeight)
  {
    const scrollBottom = popup.clientHeight + popup.scrollTop;
    const elementBottom = option.offsetTop + option.offsetHeight;
    if (elementBottom > scrollBottom)
    {
      popup.scrollTop = elementBottom - popup.clientHeight;
    }
    else if (option.offsetTop < popup.scrollTop)
    {
      popup.scrollTop = option.offsetTop;
    }
  }
}

// find next available hoverable node
function findNext(el, other)
{
  const first = el;
  do
  {
    el = el[other];
  } while (el && el !== first && !getItem.call(this, el.id).disabled);
  return el === first ? null : el;
}
