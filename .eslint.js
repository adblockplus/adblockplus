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
  overrides: [
    {
      files: ["*.spec.ts"],
      globals: {
        /**
         * These globals are all used by Jest and as such are restricted to test files
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
  rules: {
    /**
     * Since we have node-resolve installed we do not need extensions listed.
     */
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "js": "never",
        "ts": "never"
      }
    ],
    /**
     * This slightly alters the allowed order of imports to allow us to put types clearly at the bottom.
     */
    "import/order": ["error", {
      groups: [
        "index",
        "sibling",
        "parent",
        "internal",
        "external",
        "builtin",
        "object",
        "type"
      ]
    }],
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
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts"]
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true
      }
    }
  }
};
