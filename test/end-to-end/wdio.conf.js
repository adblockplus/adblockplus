"use strict";

const argv = require("minimist")(process.argv.slice(2));
const helperExtension = "test/end-to-end/helper-extension";

function getExtensionPath()
{
  const extensionPath = argv.path || argv.p;
  if (!extensionPath)
  {
    console.error("Extension path is missing");
    process.exit(1);
  }
  return extensionPath;
}

const config = {
  // https://webdriver.io/docs/options/#loglevel
  logLevel: "info"
};

module.exports = {getExtensionPath, helperExtension, config};
