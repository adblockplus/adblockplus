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

const {wire, utils} = require("./io-element");

// use native rIC where available, fallback to setTimeout otherwise
const requestIdleCallback = window.requestIdleCallback || setTimeout;

// at this point this is just a helper class
// for op-highlighter component but it could
// become a generic draw-on-canvas helper too
module.exports = class DrawingHandler
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
    const startW = image.naturalWidth;
    const startH = image.naturalHeight;
    const ratioW = Math.min(this.canvas.width, this.maxSize) / startW;
    const ratioH = Math.min(this.canvas.height, this.maxSize) / startH;
    const ratio = Math.min(ratioW, ratioH);
    const endW = startW * ratio;
    const endH = startH * ratio;
    this.ctx.drawImage(image,
                      0, 0, startW, startH,
                      0, 0, endW, endH);
    this.imageData = this.ctx.getImageData(
                      0, 0, this.canvas.width, this.canvas.height);
    const data = this.imageData.data;
    const mapping = [0x00, 0x55, 0xAA, 0xFF];
    return new Promise(resolve =>
    {
      const remap = i =>
      {
        for (; i < data.length; i++)
        {
          data[i] = mapping[data[i] >> 6];
          if (i > 0 && i % 5000 == 0)
          {
            // faster when possible, otherwise less intrusive
            // than a promise based on setTimeout as in legacy code
            return requestIdleCallback(() =>
            {
              this.draw();
              requestIdleCallback(() => remap(i + 1));
            });
          }
        }
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
      this.ctx.lineJoin = "round";
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = "rgb(208, 1, 27)";
      this.ctx.fillStyle = "rgb(0, 0, 0)";
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
        rect.x,
        rect.y,
        rect.width,
        rect.height
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
    if (this.drawing || !utils.event.isLeftClick(event))
      return;

    // react only if not drawing already
    stop(event);
    this.drawing = true;
    const start = getCoordinates(event);
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
    stop(event);
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

    stop(event);
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
    parent.appendChild(wire()`
      <span
        class="closer"
        onclick="${evt =>
        {
          if (!utils.event.isLeftClick(evt))
            return;
          // when clicked, remove the related rectangle
          // and draw the canvas again
          stop(evt);
          parent.removeChild(evt.currentTarget);
          this.paths.delete(rect);
          this.draw();
        }}"
        style="${{
          // always top right corner
          top: closeCoords.y + "px",
          left: closeCoords.x + "px"
        }}"
      >
        <img src="/skin/icons/delete.svg" />
      </span>`);
  }

  // update current rectangle size
  updateRect(event)
  {
    const coords = getCoordinates(event);
    this.rect.width = coords.x - this.rect.x;
    this.rect.height = coords.y - this.rect.y;
  }
};

// helper to retrieve absolute coordinates
function getCoordinates(event)
{
  let el = event.currentTarget;
  let x = 0;
  let y = 0;
  do
  {
    x += el.offsetLeft - el.scrollLeft;
    y += el.offsetTop - el.scrollTop;
  } while (
    (el = el.offsetParent) &&
    !isNaN(el.offsetLeft) &&
    !isNaN(el.offsetTop)
  );
  return {x: event.clientX - x, y: event.clientY - y};
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
function stop(event)
{
  event.preventDefault();
  event.stopPropagation();
}
