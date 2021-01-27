# Adblock Plus

Welcome to the repository for the Adblock Plus extension!

The main project is hosted on [GitLab][abp-ui] and, in addition to the user
interface and the web extension code, the Adblock Plus extension also includes
the Adblock Plus [core functionality][abp-core].

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

[Node](https://nodejs.org/en/) and npm

**Important**: `Node` should come installed with `npm`. If it doesn't, you can
download `npm` [here](https://www.npmjs.com/get-npm).

**Tip**: If you're installing `node` in ArchLinux, please remember to install
`npm`, too.

If you want to build the Adblock Plus extension, please refer to the
[Adblock Plus web extension README][abp-webext-readme] for additional
requirements.

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
environment using a local web server. This can be done by running npm start,
which allows you to access the HTML pages under the URL shown in the terminal,
e.g. http://127.0.0.1:8080.

Various aspects of the pages can be tested by setting parameters in the URL (see
[list of URL parameters](docs/test-env.md#url-parameters)).

**Note**: You need to [create the bundles](#bundling) for the UI page(s) that
you want to test.

### Nightlies

Nightly builds for feature and release [branches][wiki-branches] can be found
[on this page][abp-ui-nightlies].

### Unit testing

The `./test/unit` folder contains various unit tests files. Those can be run
together with other tests via `npm test` or separately via `npm $ test.unit`.

## Integration testing

The `./test/integration` folder contains various integration tests files. Those
can be run together with other tests via `npm test` or separately via
`npm $ test.integration`.

### Smoke testing

The `/test/smoke` folder contains essential files to test custom elements in
isolation. As it's done for `io-element`, you need to add at least an
`io-element.js` test file and its `io-element.html` related page.

You can run `npm run $ test:io-element.js` to create the HTML page inside the
`/smoke` folder.

### End-to-end testing

The `./test/end-to-end/tests` folder contains various end-to-end tests. Run 
`npm run test:end-to-end -- -p EXTENSION_PATH` in order to execute tests in the
latest stable Chrome browser, where `EXTENSION_PATH` is path to the extension
root folder. The `./test/end-to-end/config.js` file contains paths and
descriptions of each executable test.

### Linting

You can lint all files via `npm run lint` or lint only specific file types:
- JavaScript: `npm run $ lint.js`
- SASS: `npm run $ lint.css`
- Translation files: `npm run $ lint.locale`

**Note**: Both `eslint` and `stylelint` can help fix issues via `--fix` flag.
You can try the example below via [npx][npx] which should be automatically
included when you install `npm`.

`npx stylelint --fix skin/real-file-name.css`

## Building

### Bundling the UI

Various files need to be generated before using the UI. When building the UI
for inclusion in the extension, this is achieved using `npm run dist`.

For usage [in the test environment](#testing), you can run `npm run bundle` to
generate the various bundles for all [UI elements](#ui-elements) or
`npm run $ bundle.<page ID>` to create only those that are necessary for a
specific UI page.  Additionally, you need to run `npm run $ bundle.mocks` in
order to create the bundle for the mocks that are being used in the test
environment.

Beyond that, this repository contains [various utilities][wiki-utils] that we
rely on across our development process.

### Building the extension

In order to build the extension you need to run `git submodule update --init`
before you can navigate to the adblockpluschrome/ directory to follow the
instructions for [building Adblock Plus][abp-webext-readme-build].

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



[abp-core]: https://gitlab.com/eyeo/adblockplus/adblockpluscore/
[abp-spec]: https://gitlab.com/eyeo/specs/spec/tree/master/spec/abp
[abp-ui]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/
[abp-ui-nightlies]: https://wspee.gitlab.io/adblockplusui-nightlies/
[abp-ui-tags]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/tags
[abp-webext-readme]: /adblockpluschrome/README.md
[abp-webext-readme-build]: /adblockpluschrome/README.md#building
[abp-webext-releases]: https://github.com/adblockplus/adblockpluschrome/releases
[badge-pipeline-image]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/badges/master/pipeline.svg
[badge-pipeline-link]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/-/commits/master
[eyeo]: https://eyeo.com/
[eyeo-terms]: https://adblockplus.org/terms
[gpl3]: https://www.gnu.org/licenses/gpl.html
[npx]: https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b
[wiki-branches]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/wikis/development-workflow#naming-schemes
[wiki-utils]: https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/-/wikis/utilities
