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
    "standard",
    "plugin:prettier/recommended",
    "plugin:@typescript-eslint/eslint-recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    // The no-shadow rule must be used from @typescript-eslint instead of
    // eslint, because it triggers false positives for any enum declaration.
    // See https://typescript-eslint.io/rules/no-shadow/#how-to-use
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": "error",

    // The no-unused-vars rule must be used from @typescript-eslint instead of
    // eslint, because it triggers false positives for globals in *.d.ts files.
    // See https://typescript-eslint.io/rules/no-unused-vars/#how-to-use
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",

    // We need this to support no-floating-promises, which we want to
    // eventually enforce.
    // See https://typescript-eslint.io/rules/no-floating-promises/#ignorevoid
    "no-void": ["error", {allowAsStatement: true}]
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
