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

import api from "./api";
import {$, $$} from "./dom";
import IOElement from "./io-element";

const {getMessage} = browser.i18n;

class IOPopupFooter extends IOElement
{
  get defaultState()
  {
    return {messages: [], current: 0, animationIsOn: false};
  }

  created()
  {
    this._animationDuration = 3000;
    this.style.setProperty(
      "--animation-duration",
      this._animationDuration / 1000 + "s"
    );
    this._canAnimate = true;
    this.addEventListener("mouseenter", this.stopAnimation);
    this.addEventListener("mouseleave", this.startAnimation);
    this.addEventListener("focusin", this.stopAnimation);
    this.addEventListener("focusout", this.startAnimation);
  }

  attributeChangedCallback()
  {
    this.render();
  }

  onclick(event)
  {
    const {currentTarget} = event;

    // manually switch tabs
    if (currentTarget.getAttribute("role") === "tab")
    {
      this.stopAnimation();
      this._canAnimate = false;

      const idx = parseInt(currentTarget.id.split("-")[2], 10);

      this.setState({current: idx});

      return;
    }

    // handle anchors
    if (currentTarget.nodeName === "A")
    {
      event.preventDefault();
      event.stopPropagation();
      browser.tabs
      .create({url: currentTarget.href})
      .then(
        // force closing popup which is not happening in Firefox
        // @link https://issues.adblockplus.org/ticket/7017
        () => window.close()
      );
    }
  }

  // only used for tabs navigation with arrow keys
  onkeyup(event)
  {
    const {currentTarget} = event;

    if (currentTarget.getAttribute("role") !== "tab")
      return;

    let direction = 0;
    const isRTL = document.documentElement.getAttribute("dir") === "rtl";
    const idx = parseInt(currentTarget.id.split("-")[2], 10);

    switch (event.key)
    {
      case "ArrowLeft":
        direction = -1;
        break;
      case "ArrowRight":
        direction = 1;
        break;
    }

    if (!direction)
      return;

    if (isRTL)
      direction *= -1;

    this._canAnimate = false;
    let newIdx = idx + direction;

    if (newIdx >= this.state.messages.length)
      newIdx = 0;
    else if (newIdx < 0)
      newIdx = this.state.messages.length - 1;

    this.setState({current: newIdx});
    $(`#footer-tab-${newIdx}`).focus();
  }

  startAnimation()
  {
    if (!this._canAnimate)
      return;

    clearInterval(this._timer);
    this._timer = setInterval(() =>
    {
      const nextIdx = (this.state.current + 1) % this.state.messages.length;
      this.setState({current: nextIdx});
    }, this._animationDuration);

    this.setState({animationIsOn: true});
  }

  stopAnimation()
  {
    clearInterval(this._timer);
    this.setState({animationIsOn: false});
  }

  setupDoclinks()
  {
    if (this._setupDoclinksInitialized)
      return;

    const {store} = document.documentElement.dataset;
    const anchors = $$("a[data-doclink]", this);

    if (!store)
      return;

    this._setupDoclinksInitialized = true;
    for (const anchor of anchors)
    {
      const doclink = anchor.dataset.doclink.replace("%store%", store);
      api.doclinks.get(doclink).then((url) =>
      {
        anchor.target = anchor.target || "_blank";
        anchor.href = url;
      });
    }
  }

  render()
  {
    const {messages, animationIsOn} = this.state;

    if (!messages)
      return;

    this.html`
    <ul class="tabs ${animationIsOn ? "animated" : ""}" role="tablist">
      ${messages.map(getTab, this)}
    </ul>
    <ul class="panels">
      ${messages.map(getPanel, this)}
    </ul>`;

    this.setupDoclinks();
  }
}

IOPopupFooter.define("io-popup-footer");

function getPanel(message, idx)
{
  const {current} = this.state;

  return IOElement.wire(message, ":panel")`
  <li
    id="footer-panel-${idx}"
    role="tabpanel"
    aria-hidden=${current === idx ? "false" : "true"}
  >
    <span id="footer-panel-description-${idx}" class="message">
      ${{i18n: message.i18n}}
    </span>
    <span class="buttons" ?hidden=${current !== idx}>
      ${message.buttons.map(getPanelButton, this)}
    </span>
  </li>`;
}

function getTab(message, idx)
{
  const {current} = this.state;

  return IOElement.wire(message, ":tab")`
  <li><button
    id="footer-tab-${idx}"
    role="tab"
    aria-controls="footer-panel-${idx}"
    aria-labelledby="footer-panel-description-${idx}"
    aria-selected=${current === idx ? "true" : "false"}
    tabindex=${current !== idx ? -1 : 0}
    onclick=${this}
    onkeyup=${this}
  /></li>`;
}

function getPanelButton(button)
{
  switch (button.action)
  {
    case "open-doclink":
      const {image} = button;

      return IOElement.wire(button)`
      <a
        class="${image ? "icon" : ""}"
        data-doclink=${button.doclink}
        onclick=${this}
      >${
        image ?
        IOElement.wire()`
          <img src="${image.url}" alt="${getMessage(image.i18nAlt)}"/>` :
        IOElement.wire()`${{i18n: button.i18n}}`
      }</a>`;
  }
}
