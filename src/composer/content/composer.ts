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

// Modules from legacy directories don't have type information yet, and adding
// it is not trivial. Therefore we're first moving them over and apply the
// coding style, and we're going to add type information in a subsequent step.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import api from "../../core/api/front";

// The page ID for the popup filter selection dialog (top frame only).
let blockelementPopupId = null;

// Element picking state (top frame only).
let currentlyPickingElement = false;
let lastMouseOverEvent = null;

// During element picking this is the currently highlighted element. When
// element has been picked this is the element that is due to be blocked.
let currentElement = null;

// Highlighting state, used by the top frame during element picking and all
// frames when the chosen element is highlighted red.
let highlightedElementsSelector = null;
let highlightedElementsInterval = null;

// Last right click state stored for element blocking via the context menu.
let lastRightClickEvent = null;
let lastRightClickEventIsMostRecent = false;

let keepPreviewEnabled = false;
let previewSelectors = [];

/* Utilities */

function getURLFromElement(element): any {
  if (element.localName === "object") {
    if (element.data) {
      return element.data;
    }

    for (const child of element.children) {
      if (
        child.localName === "param" &&
        child.name === "movie" &&
        child.value
      ) {
        return new URL(child.value, document.baseURI).href;
      }
    }

    return null;
  }

  return element.currentSrc || element.src;
}

async function getFiltersForElement(element): Promise<any> {
  const src = element.getAttribute("src");
  return await browser.runtime.sendMessage({
    type: "composer.getFilters",
    tagName: element.localName,
    id: element.id,
    src: src && src.length <= 1000 ? src : null,
    style: element.getAttribute("style"),
    classes: Array.prototype.slice.call(element.classList),
    url: getURLFromElement(element)
  });
}

async function getBlockableElementOrAncestor(
  element
): Promise<HTMLElement | null> {
  // We assume that the user doesn't want to block the whole page.
  // So we never consider the <html> or <body> element.
  while (
    element &&
    element !== document.documentElement &&
    element !== document.body
  ) {
    if (!(element instanceof HTMLElement) || element.localName === "area") {
      // We can't handle non-HTML (like SVG) elements, as well as
      // <area> elements (see below). So fall back to the parent element.
      element = element.parentElement;
    } else if (element.localName === "map") {
      // If image maps are used mouse events occur for the <area> element.
      // But we have to block the image associated with the <map> element.
      const images = document.querySelectorAll("img[usemap]");
      let image = null;

      for (const currentImage of images) {
        const usemap = currentImage.getAttribute("usemap");
        const index = usemap.indexOf("#");

        if (index !== -1 && usemap.substr(index + 1) === element.name) {
          image = currentImage;
          break;
        }
      }

      element = image;
    } else {
      // Finally, if none of the above is true, check whether we can generate
      // any filters for this element. Otherwise fall back to its parent element.
      const { filters } = await getFiltersForElement(element);
      if (filters.length > 0) {
        return element;
      }
      return await getBlockableElementOrAncestor(element.parentElement);
    }
  }

  // We reached the document root without finding a blockable element.
  return null;
}

/* Element highlighting */

// Adds an overlay to an element in order to highlight it.
function addElementOverlay(element): HTMLDivElement | null {
  let position = "absolute";
  let offsetX = window.scrollX;
  let offsetY = window.scrollY;

  for (let e = element; e; e = e.parentElement) {
    const style = getComputedStyle(e);

    // If the element isn't rendered (since its or one of its ancestor's
    // "display" property is "none"), the overlay wouldn't match the element.
    if (style.display === "none") {
      return null;
    }

    // If the element or one of its ancestors uses fixed postioning, the overlay
    // must too. Otherwise its position might not match the element's.
    if (style.position === "fixed") {
      position = "fixed";
      offsetX = offsetY = 0;
    }
  }

  const overlay = document.createElement("div");
  overlay.prisoner = element;
  overlay.className = "__adblockplus__overlay";
  overlay.setAttribute(
    "style",
    "opacity:0.4; display:inline-block !important; " +
      "overflow:hidden; box-sizing:border-box;"
  );
  const rect = element.getBoundingClientRect();
  overlay.style.width = rect.width + "px";
  overlay.style.height = rect.height + "px";
  overlay.style.left = rect.left + offsetX + "px";
  overlay.style.top = rect.top + offsetY + "px";
  overlay.style.position = position;
  overlay.style.zIndex = 0x7ffffffe;

  document.documentElement.appendChild(overlay);
  return overlay;
}

function highlightElement(element, border, backgroundColor): void {
  unhighlightElement(element);

  const highlightWithOverlay = (): void => {
    const overlay = addElementOverlay(element);

    // If the element isn't displayed no overlay will be added.
    // Moreover, we don't need to highlight anything then.
    if (!overlay) {
      return;
    }

    highlightElement(overlay, border, backgroundColor);
    overlay.style.pointerEvents = "none";

    element._unhighlight = () => {
      overlay.parentNode.removeChild(overlay);
    };
  };

  const highlightWithStyleAttribute = (): void => {
    const originalBorder = element.style.getPropertyValue("border");
    const originalBorderPriority =
      element.style.getPropertyPriority("box-shadow");
    const originalBackgroundColor =
      element.style.getPropertyValue("background-color");
    const originalBackgroundColorPriority =
      element.style.getPropertyPriority("background-color");

    element.style.setProperty("border", `2px solid ${border}`, "important");
    element.style.setProperty("background-color", backgroundColor, "important");

    element._unhighlight = () => {
      element.style.removeProperty("box-shadow");
      element.style.setProperty(
        "border",
        originalBorder,
        originalBorderPriority
      );

      element.style.removeProperty("background-color");
      element.style.setProperty(
        "background-color",
        originalBackgroundColor,
        originalBackgroundColorPriority
      );
    };
  };

  // If this element is an overlay that we've created previously then we need
  // to give it a background colour. Otherwise we need to create an overlay
  // and then recurse in order to set the overlay's background colour.
  if ("prisoner" in element) {
    highlightWithStyleAttribute();
  } else {
    highlightWithOverlay();
  }
}

function unhighlightElement(element): void {
  if (element && "_unhighlight" in element) {
    element._unhighlight();
    delete element._unhighlight;
  }
}

// Highlight elements matching the selector string red.
// (All elements that would be blocked by the proposed filters.)
function highlightElements(selectorString): void {
  unhighlightElements();

  const elements = Array.prototype.slice.call(
    document.querySelectorAll(selectorString)
  );
  highlightedElementsSelector = selectorString;

  // Highlight elements progressively. Otherwise the page freezes
  // when a lot of elements get highlighted at the same time.
  highlightedElementsInterval = setInterval(() => {
    if (elements.length > 0) {
      const element = elements.shift();
      if (element !== currentElement) {
        highlightElement(element, "#CA0000", "#CA0000");
      }
    } else {
      clearInterval(highlightedElementsInterval);
      highlightedElementsInterval = null;
    }
  }, 0);
}

// Unhighlight the elements that were highlighted by selector string previously.
function unhighlightElements(): void {
  if (highlightedElementsInterval) {
    clearInterval(highlightedElementsInterval);
    highlightedElementsInterval = null;
  }

  if (highlightedElementsSelector) {
    Array.prototype.forEach.call(
      document.querySelectorAll(highlightedElementsSelector),
      unhighlightElement
    );

    highlightedElementsSelector = null;
  }
}

/* Input event handlers */

function stopEventPropagation(event): void {
  event.stopPropagation();
}

// Hovering over an element so highlight it.
async function mouseOver(event): Promise<void> {
  lastMouseOverEvent = event;

  const element = await getBlockableElementOrAncestor(event.target);
  if (event === lastMouseOverEvent) {
    lastMouseOverEvent = null;

    if (currentlyPickingElement) {
      if (currentElement) {
        unhighlightElement(currentElement);
      }

      if (element) {
        highlightElement(element, "#CA0000", "#CA0000");
      }

      currentElement = element;
    }
  }

  event.stopPropagation();
}

// No longer hovering over this element so unhighlight it.
function mouseOut(event): void {
  if (!currentlyPickingElement || currentElement !== event.target) {
    return;
  }

  unhighlightElement(currentElement);
  event.stopPropagation();
}

// Key events - Return selects currently hovered-over element, escape aborts.
function keyDown(event): void {
  if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
    if (event.keyCode === 13 /* Return */) {
      void elementPicked(event);
    } else if (event.keyCode === 27 /* Escape */) {
      deactivateBlockElement();
    }
  }
}

/* Element selection */

// Start highlighting elements yellow as the mouse moves over them, when one is
// chosen launch the popup dialog for the user to confirm the generated filters.
function startPickingElement(): void {
  currentlyPickingElement = true;

  // Add (currently invisible) overlays for blockable elements that don't emit
  // mouse events, so that they can still be selected.
  Array.prototype.forEach.call(
    document.querySelectorAll("object,embed,iframe,frame"),
    async (element) => {
      const { filters } = await getFiltersForElement(element);
      if (filters.length > 0) {
        addElementOverlay(element);
      }
    }
  );

  /* eslint-disable @typescript-eslint/no-misused-promises */
  document.addEventListener("mousedown", stopEventPropagation, true);
  document.addEventListener("mouseup", stopEventPropagation, true);
  document.addEventListener("mouseenter", stopEventPropagation, true);
  document.addEventListener("mouseleave", stopEventPropagation, true);
  document.addEventListener("mouseover", mouseOver, true);
  document.addEventListener("mouseout", mouseOut, true);
  document.addEventListener("click", elementPicked, true);
  document.addEventListener("contextmenu", elementPicked, true);
  document.addEventListener("keydown", keyDown, true);
  /* eslint-enable @typescript-eslint/no-misused-promises */

  api.addDisconnectListener(onDisconnect);
}

// Used to hide/show blocked elements on composer.content.preview
async function previewBlockedElements(active): Promise<void> {
  if (!currentElement) {
    return;
  }

  const element = currentElement.prisoner || currentElement;
  const overlays = document.querySelectorAll(".__adblockplus__overlay");

  previewBlockedElement(element, active, overlays);

  let selectors;
  if (active) {
    ({ selectors } = await getFiltersForElement(element));
    previewSelectors = selectors;
  } else {
    selectors = previewSelectors;
    previewSelectors = [];
  }

  if (selectors.length > 0) {
    const cssQuery = selectors.join(",");
    for (const node of document.querySelectorAll(cssQuery)) {
      previewBlockedElement(node, active, overlays);
    }
  }
}

// the previewBlockedElements helper to avoid duplicated code
function previewBlockedElement(element, active, overlays): void {
  const display = active ? "none" : null;
  const find = Array.prototype.find;
  const overlay = find.call(overlays, ({ prisoner }) => prisoner === element);
  if (overlay) {
    overlay.style.display = display;
  }
  element.style.display = display;
}

// The user has picked an element - currentElement. Highlight it red, generate
// filters for it and open a popup dialog so that the user can confirm.
async function elementPicked(event): Promise<void> {
  if (!currentElement) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const element = currentElement.prisoner || currentElement;
  const { filters, selectors } = await getFiltersForElement(element);
  if (currentlyPickingElement) {
    stopPickingElement();
  }

  highlightElement(currentElement, "#CA0000", "#CA0000");

  let highlights = 1;
  if (selectors.length > 0) {
    const cssQuery = selectors.join(",");
    highlightElements(cssQuery);
    highlights = document.querySelectorAll(cssQuery).length;
  }

  await browser.runtime.sendMessage({
    type: "composer.openDialog",
    filters,
    highlights
  });
}

function stopPickingElement(): void {
  currentlyPickingElement = false;

  /* eslint-disable @typescript-eslint/no-misused-promises */
  document.removeEventListener("mousedown", stopEventPropagation, true);
  document.removeEventListener("mouseup", stopEventPropagation, true);
  document.removeEventListener("mouseenter", stopEventPropagation, true);
  document.removeEventListener("mouseleave", stopEventPropagation, true);
  document.removeEventListener("mouseover", mouseOver, true);
  document.removeEventListener("mouseout", mouseOut, true);
  document.removeEventListener("click", elementPicked, true);
  document.removeEventListener("contextmenu", elementPicked, true);
  document.removeEventListener("keydown", keyDown, true);
  /* eslint-enable @typescript-eslint/no-misused-promises */
}

/* Core logic */

// We're done with the block element feature for now, tidy everything up.
function deactivateBlockElement(popupAlreadyClosed): void {
  if (!keepPreviewEnabled) {
    void previewBlockedElements(false);
  }

  if (currentlyPickingElement) {
    stopPickingElement();
  }

  if (blockelementPopupId != null && !popupAlreadyClosed) {
    void browser.runtime.sendMessage({
      type: "composer.forward",
      targetPageId: blockelementPopupId,
      payload: {
        type: "composer.dialog.close"
      }
    });
  }

  blockelementPopupId = null;
  lastRightClickEvent = null;

  if (currentElement) {
    unhighlightElement(currentElement);
    currentElement = null;
  }
  unhighlightElements();

  const overlays = document.getElementsByClassName("__adblockplus__overlay");
  while (overlays.length > 0) {
    overlays[0].parentNode.removeChild(overlays[0]);
  }

  api.removeDisconnectListener(onDisconnect);
}

function onDisconnect(): void {
  // When the background page disconnects, it's no longer safe to send messages
  // to it, so we should instead leave it up to the browser to close the popup
  deactivateBlockElement(true);
}

function initializeComposer(): void {
  // Use a contextmenu handler to save the last element the user right-clicked
  // on. To make things easier, we actually save the DOM event. We have to do
  // this because the contextMenu API only provides a URL, not the actual DOM
  // element.
  //   We also need to make sure that the previous right click event,
  // if there is one, is removed. We don't know which frame it is in so we must
  // send a message to the other frames to clear their old right click events.
  document.addEventListener(
    "contextmenu",
    (event) => {
      lastRightClickEvent = event;
      lastRightClickEventIsMostRecent = true;

      void browser.runtime.sendMessage({
        type: "composer.forward",
        payload: {
          type: "composer.content.clearPreviousRightClickEvent"
        }
      });
    },
    true
  );

  ext.onMessage.addListener((message) => {
    switch (message.type) {
      case "composer.content.preview":
        void previewBlockedElements(message.active);
        break;
      case "composer.content.getState":
        if (window === window.top) {
          return {
            active: currentlyPickingElement || blockelementPopupId != null
          };
        }
        break;
      case "composer.content.startPickingElement":
        if (window === window.top) {
          startPickingElement();
        }
        break;
      case "composer.content.contextMenuClicked": {
        const event = lastRightClickEvent;
        deactivateBlockElement();
        if (event) {
          void getBlockableElementOrAncestor(event.target).then((element) => {
            if (element) {
              currentElement = element;
              void elementPicked(event);
            }
          });
        }
        break;
      }
      case "composer.content.finished":
        if (currentElement && message.apply) {
          // We cannot easily apply the new filters ourselves, so we're
          // keeping the preview enabled, so that similar effects can
          // be seen immediately
          keepPreviewEnabled = true;
          void previewBlockedElements(true);
        }

        deactivateBlockElement(!!message.popupAlreadyClosed);

        if (message.reload) {
          location.reload();
        }
        break;
      case "composer.content.clearPreviousRightClickEvent":
        if (!lastRightClickEventIsMostRecent) {
          lastRightClickEvent = null;
        }
        lastRightClickEventIsMostRecent = false;
        break;
      case "composer.content.dialogOpened":
        if (window === window.top) {
          blockelementPopupId = message.popupId;
        }
        break;
      case "composer.content.dialogClosed":
        // The onRemoved hook for the popup can create a race condition, so we
        // to be careful here. (This is not perfect, but best we can do.)
        if (window === window.top && blockelementPopupId === message.popupId) {
          void browser.runtime.sendMessage({
            type: "composer.forward",
            payload: {
              type: "composer.content.finished",
              popupAlreadyClosed: true
            }
          });
        }
        break;
    }
  });

  if (window === window.top) {
    void browser.runtime.sendMessage({ type: "composer.ready" });
  }
}

/**
 * Initializes filter composer content script
 */
function start(): void {
  // Firefox also injects our content scripts into blank top-level frames
  // https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/issues/1082
  if (document instanceof HTMLDocument && location.href !== "about:blank") {
    initializeComposer();
  }
}

start();
