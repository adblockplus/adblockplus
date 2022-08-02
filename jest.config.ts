/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
module.exports = {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["json", "html", "text"],
  coveragePathIgnorePatterns: [
    "node_modules/",
    "jest.setup.ts"
  ],
  setupFiles: [
    "./polyfill.js",
    "./ext/common.js",
    "./ext/content.js"
  ],
  testEnvironment: "jsdom",
  testMatch: [
    "**/*.spec.ts"
  ]
};
