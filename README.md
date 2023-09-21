# Adblock Plus

Welcome to the repository for the Adblock Plus extension!

The main project is hosted on [GitLab][abp-ui] and, in addition to the user
interface and the web extension code, the Adblock Plus extension also includes
[static filter lists][adblockinc-rules],
[eyeo's Web Extension Ad Blocking Toolkit (EWE)][eyeo-ewe] and
[eyeo's snippets][eyeo-snippets].

- [About Adblock Plus](#about-adblock-plus)
- [Prerequisites](#prerequisites)
- [UI elements](#ui-elements)
- [Testing](#testing)
- [Building](#building)
- [Contributing](#contributing)

## About Adblock Plus

Adblock Plus is a free extension that allows users to customize their web
experience. Users can block annoying ads, disable tracking and lots more. It’s
available for all major desktop browsers and for mobile devices.

Adblock Plus is an open source project licensed under [GPLv3][gpl3] and subject
to its [Terms of Use][eyeo-terms]. [eyeo GmbH][eyeo] is the parent company of
Adblock Plus.

## Prerequisites

To contribute to this project, you'll need:

- [Node][nodejs] >= 18.17.1; <19
- [npm][npm] 9

`Node` should come installed with `npm`. If it doesn't, you can
download `npm` [here][npm].

**Important:** On Windows, you need a [Linux environment running on WSL][ms-wsl]
and run the commands from within Bash.

**Tip**: If you're installing `node` in ArchLinux, please remember to install
`npm`, too.

After cloning this repository, open its folder and run `npm install`.

## UI elements

Specifications for Adblock Plus elements can be found in [eyeo's spec
repository][abp-spec].

### UI pages

These are pages that users primarily interact with because they are exposed to
them via the browser's UI.

- Bubble UI (popup)
- Developer tools panel (devtools-panel)
- Options
  - Desktop (desktop-options)
  - Mobile (Firefox) (mobile-options)

### Dialogs

These are pages that are dedicated to a specific feature and can be accessed via
UI pages.

- Filter composer (composer)
- Issue reporter (issue-reporter)

### Landing pages

These are pages that cannot be accessed via UI pages. They are either directly
or indirectly opened by the extension under certain conditions.

- Day 1 (day1)
- First run (first-run)
- Problem (problem)
- Updates (updates)

### Helper pages

These are pages that are part of another page. They are not meant to be shown on
their own.

- Bubble UI dummy (popup-dummy)
- Proxy (proxy)

### Additional extension functionality

These are parts of the extension logic which are running alongside the other
extension code in the extension's background process.

- Notifications
- Preferences

## Testing

If you don't want to build the entire extension, you can open UI pages in a test
environment using a local web server. This can be done by running `npm start`,
which allows you to access the HTML pages under the URL shown in the terminal,
e.g. http://127.0.0.1:8080.

Various aspects of the pages can be tested by setting parameters in the URL (see
[list of URL parameters](docs/test-env.md#url-parameters)).

**Note**: You need to [create the bundles](#bundling-the-ui) for the UI page(s)
that you want to test.

### Nightlies

Nightly builds for feature and release [branches][wiki-branches] can be found
as artifacts [from this page][abp-ui-nightlies].

### Unit testing

The `./test/unit` folder contains various unit tests files. Those can be run
together with other tests via `npm test` or separately via `npm $ test.unit`.

## Integration testing

The `./test/integration` folder contains various integration tests files. Those
can be run together with other tests via `npm test` or separately via
`npm $ test.integration`.

### End-to-end testing

The `./test/end-to-end/tests` folder contains various end-to-end tests. After
generating the [unpacked development build](#building-the-extension) of the
extension for Chrome, and [packed .xpi build](#building-the-extension)
of the extension for Firefox, the tests can be executed in the latest stable
Chrome and Firefox browsers by running `npm run test:end-to-end` - this will
cleanup previously created allure results, if there are any. To run the tests
without deleting existing results use `npm run test:end-to-end-no-cleanup`.

Allure reporter is used for displaying the results after the execution has been
completed. The report can be generated and opened using the
`npm run test:generate-and-open-report` command. To clean up previous results
and reports before the new test execution, run `npm run test:cleanup-reports`.

### Linting

You can lint all files via `npm run lint` or lint only specific file types:
- JavaScript/TypeScript: `npm run eslint`
- CSS: `npm run $ lint.css`
- Translation files: `npm run $ lint.locale`

**Note**: Both `eslint` and `stylelint` can help fix issues via `--fix` flag.
You can try the example below via [npx][npx] which should be automatically
included when you install `npm`.

`npx stylelint --fix css/real-file-name.css`

## Building

### Building the extension

In order to build the extension you need to first
[update its dependencies](#updating-the-dependencies). You can then run the
following command for the type of build you'd like to generate:

```sh
npm run build:{dev|release} {chrome|firefox|local} [-- <options>]
```

or

```sh
npm run build:source
```

Targets:
- **chrome**: Chromium-based browsers
- **firefox**: Firefox
- **local**: [Local test environment](#testing)

**`build:dev`:** Creates unpacked extension in _dist/devenv/\<target\>/_. It
can be loaded under _chrome://extensions/_ in Chromium-based browsers, and under
_about:debugging_ in Firefox.

**`build:release`:** Creates the following extension build files in
_dist/release/_ that can be published to the various extension stores:

- adblockpluschrome-\*.zip
- adblockplusfirefox-\*.xpi

**`build:source`:** Creates the following source archive file in _dist/release/_
that can be provided to extension stores for review purposes:

- adblockplus-\*.tar.gz

#### Options

**`--config <*.js file path>`:** Specify a path to a new configuration file
relative to _adblockpluschrome/gulpfile.js_ (see examples in
_adblockpluschrome/build/config/_).

**`--manifest-path <*.json file path>`:** Specify a path to a new
_manifest.json_ file relative to _adblockpluschrome/gulpfile.js_ (see examples
in _adblockpluschrome/build/tasks/manifest.js_).

**`--manifest-version 3` or `-m 3`:** Generate a build that's compatible with
WebExtensions Manifest version 3. If omitted, it will generate a build for
Manifest version 2.

**`--partial true`:** Run a build that will not re-build the icons, the rules
and the UI. This is useful if your new changes do not touch any of the
beforementioned parts of the extension, and you can benefit from the faster
build time. Note that you must have a run a full build once before you can
succesfully run a partial build.

#### Updating the dependencies

Install the required npm packages:

`npm install`

Rerun the above commands when the dependencies might have changed,
e.g. after checking out a new revision.

### Bundling the UI

Various files need to be generated before using the UI. When building the UI
for inclusion in the extension, this is achieved using `npm run dist`.

For usage [in the test environment](#testing), run the
[`build:dev`](#building-the-extension) script to generate the various bundles
for all [UI elements](#ui-elements).

Beyond that, this repository contains [various utilities][wiki-utils] that we
rely on across our development process.

## Release history

[Extension releases (since 3.11)][abp-ui-tags]

[Extension releases (prior to 3.11)][abp-webext-releases]

## Contributing

This project follows the typical GitLab process:

1. Fork it.
2. Create your feature branch.
3. Commit your changes.
4. Push to the branch.
5. Create a new merge request.



[abp-spec]: https://gitlab.com/eyeo/specs/spec/tree/master/spec/abp
[abp-ui]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/
[abp-ui-nightlies]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/-/pipelines?scope=branches
[abp-ui-tags]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/tags
[abp-webext-releases]: https://github.com/adblockplus/adblockpluschrome/releases
[adblockinc-rules]: https://gitlab.com/adblockinc/ext/rules
[badge-pipeline-image]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/badges/main/pipeline.svg
[badge-pipeline-link]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/-/commits/main
[eyeo]: https://eyeo.com/
[eyeo-ewe]: https://gitlab.com/eyeo/adblockplus/abc/webext-sdk
[eyeo-snippets]: https://gitlab.com/eyeo/snippets
[eyeo-terms]: https://adblockplus.org/terms
[gpl3]: https://www.gnu.org/licenses/gpl.html
[ms-wsl]: https://docs.microsoft.com/windows/wsl/install-win10
[nodejs]: https://nodejs.org/en/
[npm]: https://www.npmjs.com/get-npm
[npx]: https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b
[wiki-branches]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/wikis/development-workflow#naming-schemes
[wiki-utils]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/-/wikis/utilities
