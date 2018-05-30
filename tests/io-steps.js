/* globals module, require */

"use strict";

require("../js/io-steps");

document.addEventListener(
  "input",
  (event) =>
  {
    const input = event.target;
    const inputs = input.parentNode.querySelectorAll("input");
    const index = Array.prototype.indexOf.call(inputs, input);
    const isValid = input.checkValidity();
    document.querySelector("io-steps").setCompleted(index, isValid);
    if (isValid && index < inputs.length)
    {
      inputs[index + 1].disabled = false;
    }
  }
);

document.addEventListener(
  "DOMContentLoaded",
  () =>
  {
    document.querySelector("io-steps").addEventListener(
      "step:click",
      event =>
      {
        document.querySelectorAll("input")[event.detail].focus();
      }
    );
  }
);
