"use strict";

require("../../../js/io-filter-search");


window.onload = () =>
{
  const ioFilterSearch = document.querySelector("io-filter-search");

  ioFilterSearch.filters = [
    {text: "a"},
    {text: "ab"},
    {text: "bcd"},
    {text: "test"},
    {text: "existent"}
  ];

  ioFilterSearch.addEventListener("filter:add", log);
  ioFilterSearch.addEventListener("filter:match", log);

  function log(event)
  {
    ioFilterSearch.nextElementSibling.textContent =
      `${event.type.slice(7)}: ${JSON.stringify(event.detail)}`;
  }
};
