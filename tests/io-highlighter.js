/* globals require */

"use strict";

require("../js/io-highlighter");

document.addEventListener(
  "DOMContentLoaded",
  () =>
  {
    fetch("./image.base64.txt").then(body => body.text()).then(data =>
    {
      const ioHighlighter = document.querySelector("io-highlighter");
      ioHighlighter.edit(data);
      ioHighlighter.changeDepth.then(() =>
      {
        document.querySelector("#snapshot").disabled = false;
      });
    });
  }
);
