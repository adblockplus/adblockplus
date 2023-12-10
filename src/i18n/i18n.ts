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
import browser from "webextension-polyfill";

const i18nAttributes = ["alt", "placeholder", "title", "value"];

function assignAction(
  elements: Iterable<HTMLAnchorElement>,
  action: string | (() => void)
): void {
  for (const element of elements) {
    switch (typeof action) {
      case "string":
        element.href = action;
        element.target = "_blank";
        break;
      case "function":
        element.href = "#";
        element.addEventListener("click", (ev) => {
          ev.preventDefault();
          action();
        });
        break;
    }
  }
}

function* getRemainingLinks(
  parent: HTMLElement
): Generator<HTMLAnchorElement, void, unknown> {
  const links = parent.querySelectorAll<HTMLAnchorElement>(
    "a:not([data-i18n-index])"
  );

  for (const link of links) {
    yield link;
  }
}

export function setElementLinks(
  idOrElement: string | HTMLElement,
  ...actions: Array<string | (() => void)>
): void {
  const element =
    typeof idOrElement === "string"
      ? document.getElementById(idOrElement)
      : idOrElement;

  if (element === null) {
    return;
  }

  const remainingLinks = getRemainingLinks(element);

  for (let i = 0; i < actions.length; i++) {
    // Assign action to links with matching index
    const links = element.querySelectorAll<HTMLAnchorElement>(
      `a[data-i18n-index='${i}']`
    );

    if (links.length > 0) {
      assignAction(links, actions[i]);
      continue;
    }

    // Assign action to non-indexed link in the order they appear
    // Note that this behavior is deprecated and only exists
    // for backwards compatibility
    // https://issues.adblockplus.org/ticket/6743
    const link = remainingLinks.next();
    if (link.done ?? false) continue;

    assignAction([link.value], actions[i]);
  }
}

// Used for visual strings cleanup(ex. tags from messages used in alert())
// Function is not meant to be used together with `innerHTML`
export function stripTagsUnsafe(text: string): string {
  return text.replace(/<\/?[^>]+>/g, "");
}

// Inserts i18n strings into matching elements. Any inner HTML already
// in the element is parsed as JSON and used as parameters to
// substitute into placeholders in the i18n message.
export function setElementText(
  element: HTMLElement,
  stringName: string,
  args: any,
  children: Element[] = []
): void {
  function processString(str: string, currentElement: HTMLElement): void {
    const match = /^(.*?)<(a|em|slot|strong)(\d)?>(.*?)<\/\2\3>(.*)$/.exec(str);
    if (match !== null) {
      const [, before, name, index, innerText, after] = match;
      processString(before, currentElement);

      if (name === "slot") {
        const e = children[Number(index)];
        if (e !== undefined) {
          currentElement.appendChild(e);
        }
      } else {
        const e = document.createElement(name);
        if (typeof index !== "undefined") {
          e.dataset.i18nIndex = index;
        }
        processString(innerText, e);
        currentElement.appendChild(e);
      }

      processString(after, currentElement);
    } else currentElement.appendChild(document.createTextNode(str));
  }

  while (element.lastChild !== null) {
    element.removeChild(element.lastChild);
  }

  processString(browser.i18n.getMessage(stringName, args), element);
}

function loadI18nStrings(): void {
  function resolveStringNames(
    container?: DocumentFragment | Document | null
  ): void {
    if (container === null || container === undefined) {
      return;
    }

    {
      const elements = container.querySelectorAll<HTMLElement>("[data-i18n]");
      for (const element of elements) {
        const children = Array.from(element.children);
        setElementText(element, element.dataset.i18n ?? "", null, children);
      }
    }

    // Resolve texts for translatable attributes
    for (const attr of i18nAttributes) {
      const elements = container.querySelectorAll(`[data-i18n-${attr}]`);
      for (const element of elements) {
        const stringName = element.getAttribute(`data-i18n-${attr}`) ?? "";
        element.setAttribute(attr, browser.i18n.getMessage(stringName));
      }
    }
  }

  resolveStringNames(document);
  // Content of Template is not rendered on runtime so we need to add
  // translation strings for each Template documentFragment content
  // individually.
  for (const template of document.querySelectorAll("template"))
    resolveStringNames(template.content);
}

async function setLanguageAttributes(): Promise<void> {
  const localeInfo = await browser.runtime.sendMessage({
    type: "app.get",
    what: "localeInfo"
  });

  document.documentElement.lang = localeInfo.locale;
  document.documentElement.dir = localeInfo.bidiDir;
}

export function initI18n(): void {
  // Getting UI locale cannot be done synchronously on Firefox,
  // requires messaging the background page. For Chrome and Safari,
  // we could get the UI locale here, but would need to duplicate
  // the logic implemented in Utils.appLocale.
  void setLanguageAttributes();
  loadI18nStrings();
}
