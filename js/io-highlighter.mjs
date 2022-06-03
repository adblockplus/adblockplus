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
import DrawingHandler from "./drawing-handler";
import {$} from "./dom";

// <io-highlighter data-max-size=800 />
class IOHighlighter extends IOElement
{
  // define an initial state per each new instance
  // https://viperhtml.js.org/hyperhtml/documentation/#components-2
  get defaultState()
  {
    return {drawing: "", changeDepth: null};
  }

  // resolves once the image depth has been fully changed
  // comp.changeDepth.then(...)
  get changeDepth()
  {
    return this.state.changeDepth;
  }

  // returns true if there were hidden/highlighted areas
  get edited()
  {
    return this.drawingHandler ? this.drawingHandler.paths.size > 0 : false;
  }

  // process an image and setup changeDepth promise
  // returns the component for chainability sake
  // comp.edit(imageOrString).changeDepth.then(...);
  edit(source)
  {
    return this.setState({
      changeDepth: new Promise((res, rej) =>
      {
        const changeDepth = image =>
        {
          this.drawingHandler.changeColorDepth(image).then(res, rej);
        };

        if (typeof source === "string")
        {
          // create an image and use the source as data
          const img = this.ownerDocument.createElement("img");
          img.onload = () => changeDepth(img);
          img.onerror = rej;
          img.src = source;
        }
        else
        {
          // assume the source is an Image already
          // (or anything that can be drawn on a canvas)
          changeDepth(source);
        }
      })
    });
  }

  // the component content (invoked automatically on state change too)
  render()
  {
    if (this.state.drawing)
      this.setAttribute("drawing", this.state.drawing);
    else
      this.removeAttribute("drawing");

    this.html`
    <div class="split">
      <div class="options">
        <button
          tabindex="-1"
          class="highlight"
          onclick="${
            event =>
            {
              if (IOElement.utils.event.isLeftClick(event))
                changeMode(this, "highlight");
            }
          }"
        >
          ${{i18n: "issueReporter_screenshot_highlight"}}
        </button>
        <button
          tabindex="-1"
          class="hide"
          onclick="${
            event =>
            {
              if (IOElement.utils.event.isLeftClick(event))
                changeMode(this, "hide");
            }
          }"
        >
          ${{i18n: "issueReporter_screenshot_hide"}}
        </button>
      </div>
      <canvas />
    </div>`;

    // first time only, initialize the DrawingHandler
    // through the newly created canvas
    if (!this.drawingHandler)
      this.drawingHandler = new DrawingHandler(
        $("canvas", this),
        parseInt(this.dataset.maxSize, 10) || 800
      );
  }

  // shortcut for internal canvas.toDataURL()
  toDataURL()
  {
    return $("canvas", this).toDataURL();
  }
}

IOHighlighter.define("io-highlighter");

const changeMode = (self, mode) =>
{
  const drawing = self.state.drawing === mode ? "" : mode;
  self.drawingHandler.mode = mode === "hide" ? "fill" : "stroke";
  self.setState({drawing});
};
