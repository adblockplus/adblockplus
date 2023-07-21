/* eslint-env node */

"use strict";

/**
 * This is the legacy ESLint configuration, used for files that are in
 * the `adblockpluschrome` directory.
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
    exports: true,
    ext: true,
    module: true,
    require: true
  },
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module"
  },
  rules: {
    "curly": ["error", "multi-or-nest", "consistent"],
    "spaced-comment": ["error", "always", {block: {exceptions: ["*"]}}]
  },
  overrides: [
    {
      files: [
        "./devtools.js", "./ext/*.js", "*.cjs"
      ],
      parserOptions: {
        sourceType: "script"
      }
    }
  ]
};
