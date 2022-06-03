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

import IOElement from "./io-element";
import {relativeCoordinates} from "./dom";

// use native requestIdleCallback where available, fallback to setTimeout
const requestIdleCb = window.requestIdleCallback || setTimeout;

// at this point this is just a helper class
// for op-highlighter component but it could
// become a generic draw-on-canvas helper too
class DrawingHandler
{
  constructor(canvas, maxSize)
  {
    this.paths = new Set();
    this.canvas = canvas;
    this.maxSize = maxSize;

    // the canvas needs proper width and height
    const canvasRect = canvas.getBoundingClientRect();
    canvas.width = canvasRect.width;
    canvas.height = canvasRect.height;

    // define a ratio that will produce an image with at least
    // 800px (maxSize) width and multiply by the device pixel ratio
    // to preserve the image quality on HiDPi screens.
    this.ratio = (maxSize / canvas.width) * (window.devicePixelRatio || 1);

    // it also needs to intercept all events
    if ("onpointerup" in canvas)
    {
      // the instance is the handler itself, no need to bind anything
      canvas.addEventListener("pointerdown", this, {passive: false});
      canvas.addEventListener("pointermove", this, {passive: false});
      canvas.addEventListener("pointerup", this, {passive: false});
      document.addEventListener("pointerup", this, {passive: false});
    }
    else
    {
      // some browser might not have pointer events.
      // the fallback should be regular mouse events
      this.onmousedown = this.onpointerdown;
      this.onmousemove = this.onpointermove;
      this.onmouseup = this.onpointerup;
      canvas.addEventListener("mousedown", this, {passive: false});
      canvas.addEventListener("mousemove", this, {passive: false});
      canvas.addEventListener("mouseup", this, {passive: false});
      document.addEventListener("mouseup", this, {passive: false});
    }
  }

  // draws an image and it starts processing its data
  // in an asynchronous, not CPU greedy, way.
  // It returns a promise that will resolve only
  // once the image has been fully processed.
  // Meanwhile, it is possible to draw rectangles on top.
  changeColorDepth(image)
  {
    this.clear();
    const {naturalWidth, naturalHeight} = image;
    const canvasWidth = this.canvas.width * this.ratio;
    const canvasHeight = (canvasWidth * naturalHeight) / naturalWidth;
    // resize the canvas to the displayed image size
    // to preserve HiDPi pixels
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    // force its computed size in normal CSS pixels
    this.canvas.style.width = Math.round(canvasWidth / this.ratio) + "px";
    this.canvas.style.height = Math.round(canvasHeight / this.ratio) + "px";
    // draw resized image accordingly with new dimensions
    this.ctx.drawImage(
      image,
      0, 0, naturalWidth, naturalHeight,
      0, 0, canvasWidth, canvasHeight
    );
    // collect all info to process the iamge data
    this.imageData = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = this.imageData.data;
    const length = data.length;
    const mapping = [0x00, 0x55, 0xAA, 0xFF];
    // don't loop all pixels at once, assuming devices
    // capable of HiDPi images have also enough power
    // to handle all those pixels.
    const avoidBlocking = Math.round(5000 * this.ratio);
    return new Promise(resolve =>
    {
      const remap = i =>
      {
        for (; i < length; i++)
        {
          data[i] = mapping[data[i] >> 6];
          if (i > 0 && i % avoidBlocking == 0)
          {
            notifyColorDepthChanges.call(this, i, length);
            // faster when possible, otherwise less intrusive
            // than a promise based on setTimeout as in legacy code
            return requestIdleCb(() =>
            {
              this.draw();
              requestIdleCb(() => remap(i + 1));
            });
          }
        }
        notifyColorDepthChanges.call(this, i, length);
        resolve();
      };
      remap(0);
    });
  }

  // setup the context the first time, and clean the area
  clear()
  {
    if (!this.ctx)
    {
      this.ctx = this.canvas.getContext("2d");
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = "#ED1E45";
    this.ctx.fillStyle = "#000";
    this.ctx.lineWidth = 4 * this.ratio;
  }

  // draw the image during or after it's being processed
  // and draw on top all rectangles
  draw()
  {
    this.clear();
    if (this.imageData)
    {
      this.ctx.putImageData(this.imageData, 0, 0);
    }
    for (const rect of this.paths)
    {
      const method = `${rect.type}Rect`;
      this.ctx[method](
        rect.x * this.ratio,
        rect.y * this.ratio,
        rect.width * this.ratio,
        rect.height * this.ratio
      );
    }
  }

  // central event dispatcher
  // https://dom.spec.whatwg.org/#interface-eventtarget
  handleEvent(event)
  {
    this[`on${event.type}`](event);
  }

  // pointer events to draw on canvas
  onpointerdown(event)
  {
    // avoid multiple pointers/fingers
    if (this.drawing || !IOElement.utils.event.isLeftClick(event))
      return;

    // react only if not drawing already
    stopEvent(event);
    this.drawing = true;
    const start = relativeCoordinates(event);
    // set current rect to speed up coordinates updates
    this.rect = {
      type: this.mode,
      x: start.x,
      y: start.y,
      width: 0,
      height: 0
    };
    this.paths.add(this.rect);
  }

  onpointermove(event)
  {
    // only if drawing
    if (!this.drawing)
      return;

    // update the current rect coordinates
    stopEvent(event);
    this.updateRect(event);
    // update the canvas view
    this.draw();
  }

  onpointerup(event)
  {
    // drop only if drawing
    // avoid issues when this event happens
    // outside the expected DOM node (or outside the browser)
    if (!this.drawing)
      return;

    stopEvent(event);
    if (event.currentTarget === this.canvas)
    {
      this.updateRect(event);
    }
    this.draw();
    this.drawing = false;

    // get out of here if the mouse didn't move at all
    if (!this.rect.width && !this.rect.height)
    {
      // also drop current rect from the list: it's useless.
      this.paths.delete(this.rect);
      return;
    }
    const rect = this.rect;
    const parent = this.canvas.parentNode;
    const closeCoords = getRelativeCoordinates(
      this.canvas,
      rect,
      {
        x: rect.x + rect.width,
        y: rect.y + rect.height
      }
    );

    // use the DOM to show the close event
    //  - always visible, even outside the canvas
    //  - no need to re-invent hit-test coordinates
    //  - no need to redraw without closers later on
    parent.appendChild(IOElement.wire()`
      <span
        class="closer"
        onclick="${
          evt =>
          {
            if (!IOElement.utils.event.isLeftClick(evt))
              return;
            // when clicked, remove the related rectangle
            // and draw the canvas again
            stopEvent(evt);
            parent.removeChild(evt.currentTarget);
            this.paths.delete(rect);
            this.draw();
          }
        }"
        style="${{
          // always top right corner
          top: closeCoords.y + "px",
          left: closeCoords.x + "px"
        }}"
      >
        <img src="/skin/icons/close.svg" />
      </span>`);
  }

  // update current rectangle size
  updateRect(event)
  {
    const coords = relativeCoordinates(event);
    this.rect.width = coords.x - this.rect.x;
    this.rect.height = coords.y - this.rect.y;
  }
}

function notifyColorDepthChanges(value, max)
{
  const info = {detail: {value, max}};
  const ioHighlighter = this.canvas.closest("io-highlighter");
  ioHighlighter.dispatchEvent(new CustomEvent("changecolordepth", info));
}

// helper to retrieve absolute page coordinates
// of a generic target node
function getRelativeCoordinates(canvas, start, end)
{
  const x = Math.max(start.x, end.x) + canvas.offsetLeft;
  const y = Math.min(start.y, end.y) + canvas.offsetTop;
  return {x: Math.round(x), y: Math.round(y)};
}

// prevent events from doing anything
// in the current node, and every parent too
function stopEvent(event)
{
  event.preventDefault();
  event.stopPropagation();
}

export default DrawingHandler;
