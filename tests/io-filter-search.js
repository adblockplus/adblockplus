"use strict";

require("../js/io-filter-search");


window.onload = () =>
{
  const ioFilterSearch = document.querySelector("io-filter-search");

  ioFilterSearch.filters = [
    {rule: "a"},
    {rule: "ab"},
    {rule: "bcd"},
    {rule: "test"},
    {rule: "existent"}
  ];

  ioFilterSearch.addEventListener("filter:add", log);
  ioFilterSearch.addEventListener("filter:show", log);

  function log(event)
  {
    ioFilterSearch.nextElementSibling.textContent =
      `${event.type.slice(7)}: ${event.detail}`;
  }
};
