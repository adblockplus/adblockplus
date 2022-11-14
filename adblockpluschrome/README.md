Adblock Plus for Chrome, Opera, Microsoft Edge and Firefox
==========================================================

This repository contains the platform-specific Adblock Plus source code for
Chrome, Opera, Microsoft Edge and Firefox. It can be used to build
Adblock Plus for these platforms.

Building
---------

### Building the extension

Run the following command in the project directory:

    npx gulp build -t {chrome|firefox} [-c development] [-m 3]

This will create a build with a name in the form
_adblockpluschrome-n.n.n.zip_ or _adblockplusfirefox-n.n.n.xpi_. These builds
are unsigned. They can be submitted as-is to the extension stores, or if
unpacked loaded in development mode for testing (same as devenv builds below).

You can pass the `-m 3` argument to generate a build that's compatible with
WebExtensions Manifest version 3. If omitted, it will generate a build for
Manifest version 2.

You can pass the `--partial true` argument to run a build that will not re-build the EWE, the icons, the rules and the UI. This is useful if your new changes do not touch any of the beforementioned parts of the extension, and you can benefit from the faster build time. Note that you must have a run a full build once before you can succesfully run a partial build.

You can pass the `--skip-type-checks true` argument to skip type checking of TypeScript files that are imported by JavaScript files within the `adblockpluschrome` directory. This will speed up build time, and is useful in cases where you don't have changes inside of TypeScript files, and don't need re-checking the types.


### Development environment

To simplify the process of testing your changes you can create an unpacked
development environment. For that run one of the following command:

    npx gulp devenv -t {chrome|firefox}

This will create a _devenv.*_ directory in the project directory. You can load
the directory as an unpacked extension under _chrome://extensions_ in
Chromium-based browsers, and under _about:debugging_ in Firefox. After making
changes to the source code re-run the command to update the development
environment, and the extension should reload automatically after a few seconds.

### Source distribution

In order to build a source distribution `.tar.gz` file, run the following
command:

        npx gulp source

### Customization

If you wish to create an extension based on our code and use the same
build tools, we offer some customization options.

This can be done by:

 - Specifying a path to a new configuration file relative to `gulpfile.js`
(it should match the structure found in `build/config/`).

        npx gulp {build|devenv} -t {chrome|firefox} --config config.js

 - Specifying a path to a new `manifest.json` file relative to `gulpfile.js`.
You should check `build/manifest.json` and `build/tasks/manifest.js` to see
how we modify it.

        npx gulp {build|devenv} -t {chrome|firefox} --manifest-path manifest.json
