"use strict";

require("../js/io-scrollbar");

const handler = {
  handleEvent(event)
  {
    const node = event.currentTarget;
    this[`on${node.localName.replace(/-/g, "")}${event.type}`](event);
  },
  onioscrollbarscroll()
  {
    const scrollTop = this.panel.scrollHeight / this.size * this.bar.position;
    // avoid scrollTop triggering again "scroll" event
    // backfiring on the bar position
    this._ignoreScroll = true;
    this.panel.scrollTop = scrollTop;
  },
  ondivscroll()
  {
    if (this._ignoreScroll)
    {
      this._ignoreScroll = false;
      return;
    }
    const position = this.panel.scrollTop * this.size / this.panel.scrollHeight;
    this.bar.position = position;
  }
};

addEventListener(
  "load",
  () => dispatchEvent(new CustomEvent("resize"))
);

addEventListener(
  "resize",
  () =>
  {
    const search = new URLSearchParams(location.search);
    const size = parseInt(search.get("size") || 200, 10);
    const ioScrollBar = document.querySelector("io-scrollbar");
    const panel = ioScrollBar.previousElementSibling;
    panel.style.height = size + "px";
    ioScrollBar.style.height = size + "px";
    ioScrollBar.direction = "vertical";
    ioScrollBar.size = panel.scrollHeight;
    handler.bar = ioScrollBar;
    handler.panel = panel;
    handler.size = size;
    // use one handler to avoid storing all listeners around
    // so that setting same handler twice won't affect the DOM
    ioScrollBar.addEventListener("scroll", handler);
    panel.addEventListener("scroll", handler);
  }
);
