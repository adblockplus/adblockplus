/* eslint-env node */

"use strict";

/**
 * This is our future target ESLint configuration that we eventually plan to
 * apply to the whole codebase.
 *
 * For the time being, it is used for TypeScript files.
 *
 * For the ESLint configuration for JavaScript files see `.eslintrc-legacy.js`.
 */
module.exports = {
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
    "@typescript-eslint/no-unused-vars": "error"
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
