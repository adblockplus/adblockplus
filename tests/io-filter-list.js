"use strict";

require("../js/io-filter-list");

const length = (Math.random() * 50) >>> 0;
const ioFilterList = document.querySelector("io-filter-list");
ioFilterList.filters = require("./random-filter-list")(length);
