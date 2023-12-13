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
    // To ease the transition to strict-boolean-expressions, we will
    // only issue warnings instead of errors for now.
    "@typescript-eslint/strict-boolean-expressions": "warn",

    // We agreed that we don't want to allow single line code blocks. The
    // decision was made during a dev sync meeting on October 17th, 2023.
    "curly": "error"
  },
  overrides: [
    {
      // Let ESLint know that we use Jest for our specs.
      files: ["*.spec.ts"],
      env: {
        jest: true
      }
    }
  ]
};
