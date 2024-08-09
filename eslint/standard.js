/* eslint-env node */

"use strict";

/**
 * This is our future target ESLint configuration that we eventually will
 * apply to the whole codebase.
 *
 * Currently it is applied to code in the `src` directory.
 *
 * For legacy ESLint configurations that are used for the rest of the
 * codebase see `legacy.js` and `adblockpluschrome.js`.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    webextensions: true
  },
  extends: [
    "standard-with-typescript",
    "plugin:prettier/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["prettier"],
  rules: {
    "@typescript-eslint/strict-boolean-expressions": "off",
    "curly": "error"
  }
};
