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

const DELAY = 200;

const IOElement = require("./io-element");

const {events} = require("./dom");

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
    return ["action", "change", "disabled", "expanded", "items", "placeholder"];
  }

  created()
  {
    this._blurTimer = 0;
    this._bootstrap = true;
    this._text = browser.i18n.getMessage("options_language_add");
    // in case the component has been addressed and
    // it has already an attached items property
    if (this.hasOwnProperty("items"))
    {
      const items = this.items;
      delete this.items;
      this.items = items;
    }
  }

  // can be overridden but by default
  // it returns the item.originalTitle
  getItemTitle(item)
  {
    return item.originalTitle;
  }

  get change()
  {
    return !!this._change;
  }

  set change(value)
  {
    this._change = !!value;
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
    setTimeout(
      () =>
      {
        // be sure the eleemnt is blurred to re-open on focus
        if (!value)
          this.ownerDocument.activeElement.blur();
        this.dispatchEvent(new CustomEvent(value ? "open" : "close"));
      },
      DELAY + 1
    );
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
        if (!item.disabled)
        {
          // simulate hover it and exit
          hover.call(this, "items", item);
          fixSize.call(this);
          return;
        }
      }
      // if no item was selected, hover the first one
      hover.call(this, "items", items[0]);
    }

    // ensure the list of items reflect the meant style
    fixSize.call(this);
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
    if (this.expanded)
      this._blurTimer = setTimeout(() =>
      {
        this.expanded = false;
      }, DELAY);
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
    switch (events.key(event))
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
        event.preventDefault();
        this.expanded = false;
        break;
      case KeyCode.ARROW_UP:
        const prev = findNext.call(
          this,
          hovered, "previousElementSibling"
        );
        if (prev)
          hover.call(this, "key", getItem.call(this, prev.id));
        event.preventDefault();
        break;
      case KeyCode.ARROW_DOWN:
        const next = findNext.call(
          this,
          hovered, "nextElementSibling"
        );
        if (next)
          hover.call(this, "key", getItem.call(this, next.id));
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
    const el = event.target.closest('[role="option"]');
    if (el)
    {
      if (el.getAttribute("aria-disabled") !== "true")
      {
        this.dispatchEvent(new CustomEvent("change", {
          detail: getItem.call(this, el.id)
        }));
      }
      this.expanded = false;
    }
  }

  onmousedown(event)
  {
    if (this.expanded)
    {
      this.expanded = false;
    }
  }

  onmouseover(event)
  {
    const el = event.target.closest('[role="option"]');
    if (el && !el.classList.contains("hover"))
      hover.call(this, "mouse",
                  this._items.find(item => getID(item) === el.id));
  }

  // the view
  render()
  {
    const {change} = this;
    const enabled = this._items.filter(item => !item.disabled).length;
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
      onblur="${this}" onfocus="${this}"
      onkeydown="${this}" onmousedown="${this}"
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
      const selected = !change && !item.disabled;
      const disabled = selected && enabled === 1;
      return wire(this, `html:${id}`)`
      <li
        id="${id}"
        role="option"
        aria-disabled="${change ? !item.disabled : disabled}"
        aria-selected="${selected}"
      >${this.getItemTitle(item)}</li>`;
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
function hover(type, item)
{
  const id = getID(item);
  const hovered = this.querySelector(".hover");
  if (hovered)
    hovered.classList.remove("hover");
  const option = this.querySelector(`#${id}`);
  option.classList.add("hover");
  this.label.setAttribute("aria-activedescendant", id);
  const popup = this.popup;
  // if it's the mouse moving, don't auto scroll (annoying)
  if (type !== "mouse" && popup.scrollHeight > popup.clientHeight)
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

function fixSize()
{
  if (!this._fixedSize)
  {
    this._fixedSize = true;
    this.style.setProperty("--height", this.label.offsetHeight + "px");
  }
}
