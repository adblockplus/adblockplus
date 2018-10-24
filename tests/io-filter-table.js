"use strict";

require("../js/io-filter-table");

const length = (Math.random() * 50) >>> 0;
const ioFilterTable = document.querySelector("io-filter-table");
ioFilterTable.filters = require("./random-filter-list")(length);
