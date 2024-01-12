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
  resetMocks: true,
  restoreMocks: true,
  setupFiles: [
    "jest-webextension-mock",
    "./mocks/js/jest-polyfill.js",
    "./mocks/js/ext/common.js",
    "./mocks/js/ext/content.js"
  ],
  globals: {
    fetch: global.fetch
  },
  testEnvironment: "jsdom",
  testMatch: ["**/*.spec.ts"]
};
