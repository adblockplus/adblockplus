/* eslint-env node */

"use strict";

/**
 * For a detailed explanation regarding each configuration property and type
 * check, visit:
 * https://jestjs.io/docs/configuration
 */
module.exports = {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["json", "html", "text"],
  setupFiles: [
    "./mocks/js/polyfill.js",
    "./mocks/js/ext/common.js",
    "./mocks/js/ext/content.js"
  ],
  testEnvironment: "jsdom",
  testMatch: ["**/*.spec.ts"]
};
