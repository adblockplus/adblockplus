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

const {equal, deepEqual} = require("assert").strict;
const {TestEnvironment} = require("../env");
const basichtml = require("basichtml");
const {Event} = basichtml;

let document;
let env;

const expandedButtonText = "Expanded";
const notExpandedButtonText = "Not expanded";

describe("Testing io-list-box component", () =>
{
  beforeEach(() =>
  {
    const window = basichtml.init({});
    document = window.document;

    const defaultGlobals = {
      window,
      ext: {i18n: {setElementText: () => "my text"}},
      browser: {
        i18n: {
          getMessage(msg)
          {
            if (msg === "options_dialog_language_title")
              return expandedButtonText;
            else if (msg === "options_language_add")
              return notExpandedButtonText;
            return msg;
          }
        },
        runtime: {}
      }
    };

    env = new TestEnvironment({
      globals: defaultGlobals
    });

    env.requireModule("../../js/io-list-box");
    document.documentElement.innerHTML = `
      <io-list-box
        id="languages-box"
        data-text="options_language_add"
        data-expanded="options_dialog_language_title"
        ?autoclose=${true}
      ></io-list-box>
    `;
    const listBox = getComponent();
    listBox.items = [];
    listBox.items = getItems();
  });

  afterEach(() =>
  {
    env.restore();
    env = null;
  });

  it("'items' property populates the list", () =>
  {
    const ioListBox = getComponent();
    equal(ioListBox.items.length, 4);
    deepEqual(ioListBox.items[0], getItems()[0]);
    deepEqual(ioListBox.items[3], getItems()[3]);
  });
  it("'Group item creates .group element and sets description as text", () =>
  {
    const ioListBox = getComponent();
    const firstGroup = ioListBox.popup.querySelector(".group");
    equal(firstGroup.textContent, getItems()[2].description);
  });
  it("getItemTitle() returns item originalTitle", () =>
  {
    const ioListBox = getComponent();
    const firstItem = ioListBox.items[0];
    const originalTitle = ioListBox.getItemTitle(firstItem);
    equal(originalTitle, "EasyList Germany+EasyList");
  });
  it("Disabling the element disables the 'label' as well", () =>
  {
    const ioListBox = getComponent();
    const addButton = ioListBox.label;
    const checkDisabled = (disabled) =>
    {
      equal(addButton.getAttribute("disabled"), disabled);
      equal(addButton.getAttribute("aria-disabled"), disabled);
    };
    checkDisabled(false);
    ioListBox.disabled = true;
    checkDisabled(true);
  });
  it("Component is rendered based on its 'expanded' state", () =>
  {
    const ioListBox = getComponent();
    const addButton = ioListBox.label;
    equal(addButton.getAttribute("aria-expanded"), false);
    equal(addButton.textContent, `+ ${notExpandedButtonText}`);
    ioListBox.expanded = true;
    equal(addButton.getAttribute("aria-expanded"), true);
    equal(addButton.textContent, `+ ${expandedButtonText}`);
  });
  it("Focusing label expands the element", () =>
  {
    const ioListBox = getComponent();
    ioListBox.label.focus();
    equal(ioListBox.expanded, true);
  });
  it("Close select box when focus lost", (done) =>
  {
    const ioListBox = getComponent();
    // Focus first in order to set ownerDocument.activeElement in basicHTML
    ioListBox.label.focus();
    ioListBox.label.blur();
    setTimeout(() =>
    {
      equal(ioListBox.expanded, false);
      done();
    }, 400);
  });
  it("Up and down arrows should navigate items accordingly", () =>
  {
    const ioListBox = getComponent();
    const popup = ioListBox.popup;
    const button = ioListBox.label;
    const getSelectedItemId = () => popup.querySelector(".hover").id;
    const getActiveDecendant = () =>
      button.getAttribute("aria-activedescendant");
    const dispatchKeydownEvent = (type) =>
    {
      const e = new Event("keydown");
      e.key = type;
      button.dispatchEvent(e);
    };
    const getID = (item) => `li-${item.url.split("").map(
      c => c.charCodeAt(0).toString(32)
    ).join("")}`;
    const getIdByItemIndex = (index) => getID(getItems()[index]);

    button.focus();
    equal(getSelectedItemId(), getIdByItemIndex(0));
    equal(getSelectedItemId(), getActiveDecendant());
    dispatchKeydownEvent("ArrowDown");
    equal(getSelectedItemId(), getIdByItemIndex(1));
    equal(getSelectedItemId(), getActiveDecendant());
    dispatchKeydownEvent("ArrowDown");
    equal(getSelectedItemId(), getIdByItemIndex(3));
    equal(getSelectedItemId(), getActiveDecendant());
    dispatchKeydownEvent("ArrowUp");
    equal(getSelectedItemId(), getIdByItemIndex(1));
    equal(getSelectedItemId(), getActiveDecendant());
  });
});

function getComponent()
{
  return document.querySelector("io-list-box");
}

function getItems()
{
  return [
    {
      disabled: false,
      downloadStatus: "synchronize_ok",
      homepage: "https://easylist.adblockplus.org/",
      value: "Deutsch",
      originalTitle: "EasyList Germany+EasyList",
      recommended: "ads",
      url: "https://easylist-downloads.adblockplus.org/easylistgermany+easylist.txt",
      lastDownload: 1234,
      downloading: false
    },
    {
      disabled: true,
      downloadStatus: null,
      homepage: null,
      value: "English",
      originalTitle: "EasyList",
      recommended: "ads",
      url: "https://easylist-downloads.adblockplus.org/easylist.txt"
    },
    {
      type: "ads",
      group: true,
      description: "Ads"
    },
    {
      disabled: true,
      downloadStatus: null,
      homepage: null,
      value: "español",
      originalTitle: "EasyList Spanish+EasyList",
      recommended: "ads",
      url: "https://easylist-downloads.adblockplus.org/easylistspanish+easylist.txt"
    }
  ];
}
