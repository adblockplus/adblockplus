/* eslint-env node */

"use strict";

/**
 * This is the legacy ESLint configuration used for all files that are not
 * in the `src` or `adblockpluschrome` directory.
 *
 * Eventually, we will apply a new configuration which can be found
 * at `standard.js`.
 */
module.exports = {
  extends: "eslint-config-eyeo",
  root: true,
  env: {
    browser: true,
    webextensions: true
  },
  globals: {
    ext: true
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 11,
    ecmaFeatures: {
      experimentalObjectRestSpread: true
    }
  },
  overrides: [
    {
      files: ["test/**/*.js", "test/**/*.mjs"],
      env: {
        mocha: true,
        node: true
      }
    },
    {
      files: ["build/**/*.js", "build/**/*.mjs"],
      env: {
        node: true
      }
    },
    {
      files: ["lib/**/*.js"],
      env: {
        commonjs: true
      }
    },
    {
      files: [
        "*.js", "*.cjs"
      ],
      parserOptions: {
        sourceType: "script"
      }
    },
    {
      files: ["test/end-to-end/tests/*.js"],
      rules: {
        "prefer-arrow-callback": "off"
      }
    },
    {
      files: ["test/end-to-end/page-objects/*.js"],
      env: {
        jquery: true
      },
      globals: {
        $: true,
        $$: true
      }
    }
  ],
  rules: {
    // This rule was mistakenly added to eslint-config-eyeo in [1]
    // so we have to temporarily disable it while we're searching for a
    // solution in [2].
    // [1]: https://gitlab.com/eyeo/auxiliary/eyeo-coding-style/-/issues/12
    // [2]: https://gitlab.com/eyeo/auxiliary/eyeo-coding-style/-/issues/15
    "arrow-parens": 0,
    // @link https://issues.adblockplus.org/ticket/6581
    // As long as issue 6581 is under discussion, ABP UI
    // decided to put an end to all debates and use
    // the `prefer-const` rule.
    "prefer-const": ["error", {destructuring: "all"}],
    "no-prototype-builtins": 0,
    "spaced-comment": ["error", "always", {block: {exceptions: ["*"]}}]
  }
};
