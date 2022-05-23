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

const {$, $$} = require("./dom");

// used to create options
const {wire} = IOElement;

// used to map codes across browser
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

/*
  <io-list-box
    ?autoclose=${boolean} to close per each change
    data-text="i18n entry text when it's closed"
    data-expanded="optional i18n entry text when it's opened"
  />
*/
class IOListBox extends IOElement
{
  static get observedAttributes()
  {
    return ["action", "swap", "disabled", "expanded", "items"];
  }

  static get booleanAttributes()
  {
    return ["autoclose"];
  }

  created()
  {
    this._blurTimer = 0;
    this._bootstrap = true;
    // in case the component has been addressed and
    // it has already an attached items property
    if (this.hasOwnProperty("items"))
    {
      const items = this.items;
      delete this.items;
      this.items = items;
    }

    this.addEventListener("blur", this, true);
  }

  // can be overridden but by default
  // it returns the item.title
  getItemTitle(item)
  {
    return item.title;
  }

  get swap()
  {
    return !!this._swap;
  }

  set swap(value)
  {
    this._swap = !!value;
  }

  // shortcuts to retrieve sub elements
  get label()
  {
    return $(`#${this.id}label`, this);
  }

  get popup()
  {
    return $(`#${this.id}popup`, this);
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
        // be sure the element is blurred to re-open on focus
        if (!value && this.expanded)
          this.ownerDocument.activeElement.blur();
        this.dispatchEvent(new CustomEvent(value ? "open" : "close"));
      },
      DELAY + 1
    );
  }

  // items handler
  get items()
  {
    return this._items || [];
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
        if (item.group)
          continue;

        // if an item is selected
        if (!item.disabled)
        {
          // simulate hover it and exit
          hover.call(this, "items", item);
          return;
        }
      }
      // if no item was selected, hover the first one that is not a group
      hover.call(this, "items", items.find(item => !item.group));
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
    if (event.relatedTarget && this.contains(event.relatedTarget))
      return;

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
    const hovered = $(".hover", this);
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
      const detail = getItem.call(this, el.id);
      const {unselectable} = detail;
      if (el.getAttribute("aria-disabled") !== "true")
      {
        this.dispatchEvent(new CustomEvent("change", {detail}));
        this.render();
      }
      if ((this.swap || this.autoclose) && !unselectable)
      {
        this.expanded = false;
      }
    }
  }

  onmousedown(event)
  {
    this.expanded = !this.expanded;
  }

  onmouseover(event)
  {
    const el = event.target.closest('[role="option"]');
    if (el && !el.classList.contains("hover"))
    {
      const item = getItem.call(this, el.id);
      if (item)
        hover.call(this, "mouse", item);
    }
  }

  // the view
  render()
  {
    const {action, dataset, disabled, expanded, id, swap} = this;
    const enabled = this._items.filter(item => !item.disabled).length;
    let buttonText = "";
    if (expanded && dataset.expanded)
      buttonText = dataset.expanded;
    else
      buttonText = dataset.text;
    const {i18n} = browser;
    this.html`
    <button
      role="combobox"
      aria-readonly="true"
      id="${id + "label"}"
      disabled="${disabled}"
      data-action="${action}"
      aria-owns="${id + "popup"}"
      aria-disabled="${disabled}"
      aria-expanded="${expanded}"
      aria-haspopup="${id + "popup"}"
      onblur="${this}" onfocus="${this}"
      onkeydown="${this}" onmousedown="${this}"
    >${"+ " + i18n.getMessage(buttonText)}</button>
    <ul
      role="listbox"
      tabindex="-1"
      id="${id + "popup"}"
      aria-labelledby="${id + "label"}"
      hidden="${!expanded}"
      onclick="${this}" onmouseover="${this}"
    >${this._items.map(item =>
    {
      if (item.group)
        return wire()`<li class="group">${item.description}</li>`;

      const itemID = getID(item);
      const selected = !swap && !item.disabled;
      const liDisabled = item.unselectable || (selected && enabled === 1);
      return wire(this, `html:${itemID}`)`
      <li
        id="${itemID}"
        role="option"
        aria-disabled="${swap ? !item.disabled : liDisabled}"
        aria-selected="${selected}"
      >${this.getItemTitle(item)}</li>`;
    })}</ul>`;
  }
}

IOListBox.define("io-list-box");

let resizeTimer = 0;
window.addEventListener("resize", () =>
{
  // debounce the potentially heavy resize at 30 FPS rate
  // which is, at least, twice as slower than standard 60 FPS
  // scheduled when it comes to requestAnimationFrame
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() =>
  {
    resizeTimer = 0;
    for (const ioListBox of $$("io-list-box"))
    {
      // avoid computing the width if there are no items
      // or if the element is inside an invisible tab
      // where such width cannot possibly be computed
      if (!ioListBox.items || isVisible(ioListBox))
        return;

      ioListBox.style.setProperty("--width", "100%");
      // theoretically one rAF should be sufficient
      // https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model
      // but some browser needs double rAF needed to ensure layout changes
      // https://bugs.chromium.org/p/chromium/issues/detail?id=675795
      // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/15469349/
      // https://bugs.webkit.org/show_bug.cgi?id=177484
      requestAnimationFrame(() =>
      {
        requestAnimationFrame(setWidth.bind(ioListBox));
      });
    }
  }, 1000 / 30);
});

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
  return this._items.find(item => (!item.group && getID(item) === id));
}

// private helper
function hover(type, item)
{
  const id = getID(item);
  if (!id)
    return;
  const hovered = $(".hover", this);
  if (hovered)
    hovered.classList.remove("hover");
  const option = $(`#${id}`, this);
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
  }
  // skip disabled items and separators/rows without an ID
  while (el && el !== first && !isDisabled.call(this, el));
  return el === first ? null : el;
}

function isDisabled(el)
{
  return el.id && getItem.call(this, el.id).disabled;
}

function isVisible(el)
{
  const cstyle = window.getComputedStyle(el, null);
  return cstyle.getPropertyValue("display") !== "none";
}

function setWidth()
{
  this.style.setProperty("--width", this.label.offsetWidth + "px");
}
