"use strict";

const IOElement = require("../../../js/io-element");

class IOClock extends IOElement
{
  connectedCallback()
  {
    this._timer = setInterval(() => this.render(), 1000);
  }

  disconnectedCallback()
  {
    clearInterval(this._timer);
  }

  render()
  {
    this.html`
      ${{i18n: "io_clock"}}
      @${(new Date()).toLocaleTimeString()}
    `;
  }
}

IOClock.define("io-clock");
