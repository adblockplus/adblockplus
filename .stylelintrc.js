/* eslint-env node */

"use strict";

module.exports = {
  extends: "stylelint-config-eyeo",
  rules: {
    "block-closing-brace-space-after": null,
    "max-line-length": [80, {
      ignorePattern: "/https?:\/\//"
    }],
    "no-eol-whitespace": true,
    "no-missing-end-of-source-newline": true,
    "selector-no-qualifying-type": null,
    "selector-type-no-unknown": [true, {"ignore": "custom-elements"}]
  }
};
