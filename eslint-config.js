/* eslint-env node */

"use strict";

/**
 * This is our future target ESLint configuration that we eventually plan to
 * apply to the whole codebase.
 *
 * For the time being, it is used for TypeScript files.
 *
 * For the ESLint configuration for JavaScript files see `.eslintrc.json`.
 */
module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true
  },
  extends: [
    "airbnb-base",
    "plugin:prettier/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: [
    "@typescript-eslint",
    "prettier"
  ],
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts"]
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true
      }
    }
  },
  globals: {
    // We add TypeScript built-in types here to avoid running into `no-undef`.
    WindowOrWorkerGlobalScope: "readonly"
  },
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
    // We do not prefer default exports.
    "import/prefer-default-export": "off",
    // We do allow calling warn() and error()
    "no-console": ["error", {allow: ["warn", "error"]}],
    // This is already handled by TypeScript and causes ESLint to complain
    // about globals in *.d.ts files.
    // See https://github.com/typescript-eslint/typescript-eslint/blob/8176fb15299943cbf20385eb0ea7ba877e193285/docs/linting/TROUBLESHOOTING.md
    "no-undef": "off",
    // We disallow TODO comments in favor of references to tickets
    "no-warning-comments": "error",
    /**
     * Since we have node-resolve installed we do not need extensions listed.
     */
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        ts: "never"
      }
    ],
    /**
     * This is triggers false positives for "adblockpluschrome". As it is
     * designed for lerna monorepos or Yarn workspaces, we'll turn it off.
     */
    "import/no-relative-packages": "off",
    /**
     * This rule is disabled in functions since there is no problem using a
     * variable in a function before it is defined at the root. In that case
     * it is still defined before use and allows us to keep everything in
     * alphabetical order. In the case that the variable truly does not exist,
     * Typescript should let us know…
     *
     * example:
     *    const getCoordinates = (x) => retrieveCoorsJson()[x];
     *    const retrieveCoorsJson = () => fetch();
     */
    "no-use-before-define": ["error", {
      functions: false
    }]
  },
  overrides: [
    {
      files: ["*.spec.ts"],
      globals: {
        /**
         * These globals are all used by Jest and as such are restricted to
         * test files
         */
        afterEach: "readonly",
        describe: "readonly",
        beforeEach: "readonly",
        expect: "readonly",
        it: "readonly",
        jest: "readonly"
      }
    },
    {
      files: ["*.types.ts"],
      rules: {
        "no-use-before-define": "off",
        "no-unused-vars": "off"
      }
    }
  ]
};
