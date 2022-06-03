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

const {isLeftClick} = IOElement.utils.event;

class IOScrollbar extends IOElement
{
  static get observedAttributes()
  {
    return ["direction", "position", "size"];
  }

  created()
  {
    this.addEventListener(
      "click",
      (event) =>
      {
        // ignore clicks on the slider or right clicks
        if (event.target !== this || !isLeftClick(event))
          return;
        // prevents clicks action on the component
        // after dragging the slider so that it won't
        // be re-positioned again on click coordinates
        if (this._dragging)
        {
          this._dragging = false;
          return;
        }
        const {x, y} = relativeCoordinates(event);
        if (this.direction === "horizontal")
          setPosition.call(this, x - (this._sliderSize / 2));
        else if (this.direction === "vertical")
          setPosition.call(this, y - (this._sliderSize / 2));
        this.dispatchEvent(new CustomEvent("scroll"));
      }
    );
    this.addEventListener(
      "wheel",
      (event) =>
      {
        stopEvent(event);
        let delta = 0;
        if (this.direction === "vertical")
          delta = event.deltaY;
        else if (this.direction === "horizontal")
          delta = event.deltaX;
        // this extra delta transformation is mostly needed for MS Edge
        // but it works OK in every other browser too
        delta = delta * this._sliderSize / this.size;
        setPosition.call(this, this.position + delta);
        this.dispatchEvent(new CustomEvent("scroll"));
      },
      {passive: false}
    );
  }

  get defaultState()
  {
    return {
      direction: "",
      position: 0,
      size: 0
    };
  }

  get direction()
  {
    return this.state.direction;
  }

  // can be (ignore case) horizontal or vertical
  set direction(value)
  {
    value = value.toLowerCase();
    this.setState({direction: value});
    this.setAttribute("direction", value);
    // trigger eventual size recalculation
    sizeChange.call(this);
  }

  get position()
  {
    return this.state.position || 0;
  }

  set position(value)
  {
    if (!this._elSize)
      return;
    setPosition.call(this, value);
  }

  // read-only: the amount of positions covered by the slider
  get range()
  {
    return this._elSize - this._sliderSize;
  }

  get size()
  {
    return this.state.size;
  }

  set size(value)
  {
    this.setState({size: parseInt(value, 10)});
    sizeChange.call(this);
  }

  onmousedown(event)
  {
    if (!isLeftClick(event))
      return;
    this._dragging = true;
    this._coords = {
      x: event.clientX,
      y: event.clientY
    };
    const slider = event.currentTarget;
    const doc = slider.ownerDocument;
    // use the document as source of mouse events truth
    // use true as third option to intercept before bubbling
    doc.addEventListener("mousemove", this, true);
    doc.addEventListener("mouseup", this, true);
    // also prevents selection like a native scrollbar would
    // (this is specially needed for Firefox and Edge)
    doc.addEventListener("selectstart", stopEvent, true);
  }

  onmousemove(event)
  {
    const {x, y} = this._coords;
    if (this.direction === "horizontal")
    {
      const {clientX} = event;
      setPosition.call(this, this.position + clientX - x);
      this._coords.x = clientX;
    }
    else if (this.direction === "vertical")
    {
      const {clientY} = event;
      setPosition.call(this, this.position + clientY - y);
      this._coords.y = clientY;
    }
    this.dispatchEvent(new CustomEvent("scroll"));
  }

  onmouseup(event)
  {
    if (!isLeftClick(event))
      return;
    const {currentTarget: doc, target} = event;
    doc.removeEventListener("mousemove", this, true);
    doc.removeEventListener("mouseup", this, true);
    doc.removeEventListener("selectstart", stopEvent, true);
    // stop dragging if mouseup happens outside this component
    // or within this component slider (the only child)
    // otherwise let the click handler ignore the action
    // which happens through the component itself
    if (target !== this || target === this.child)
      this._dragging = false;
  }

  render()
  {
    // the component and its slider are styled 100% through CSS, i.e.
    // io-scrollbar[direction="vertical"] > .slider {}
    this.html`<div
      class="slider"
      onmousedown="${this}"
    />`;
  }
}

IOScrollbar.define("io-scrollbar");

function setPosition(value)
{
  this.setState({
    position: Math.max(
      0,
      Math.min(
        parseFloat(value),
        this.range
      )
    )
  });
  this.style.setProperty(
    "--position",
    this.state.position + "px"
  );
}

function sizeChange()
{
  if (this.direction === "horizontal")
    this._elSize = this.clientWidth;
  else if (this.direction === "vertical")
    this._elSize = this.clientHeight;
  this._sliderSize = Math.floor(
    Math.min(1, this._elSize / this.state.size) * this._elSize
  );
  if (this.direction === "horizontal")
    this._sliderSize = Math.max(this._sliderSize, this.clientHeight);
  else if (this.direction === "vertical")
    this._sliderSize = Math.max(this._sliderSize, this.clientWidth);
  this.style.setProperty("--slider-size", this._sliderSize + "px");
  // trigger eventual position recalculation
  // once this._elSize change
  // set again the style to re-position the scroller
  setPosition.call(this, this.position);
}

// if inside a container with its own wheel or mouse events,
// avoid possible backfiring through already handled events.
function stopEvent(event)
{
  event.preventDefault();
  event.stopPropagation();
}

export default IOScrollbar;
