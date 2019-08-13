Shared Adblock Plus UI code
===========================

The user interface elements defined in this repository will be used by various
Adblock Plus products like Adblock Plus for Firefox. Their functionality can be
tested within this repository, even though they might not work exactly the same
as they will do in the final product.

Installing dependencies
-----------------------

Both [python 2](https://www.python.org/downloads/) and [node](https://nodejs.org/en/), as well as [npm](https://www.npmjs.com), are required to contribute to this repository.

If you are installing `node` in ArchLinux, please remember to install `npm` too.

After cloning this repository, enter into its folder and run: `npm install`.

This should create and populate, both `./node_modules` folder and the `./buildtools` one.

**Note:** [devDependencies](https://docs.npmjs.com/files/package.json#devdependencies) are not preinstalled during extension build, use [dependencies](https://docs.npmjs.com/files/package.json#dependencies) instead.

Nightlies
---------

Nightly builds for feature and release [branches](https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/wikis/development-workflow#naming-schemes) can be found [here](https://wspee.gitlab.io/adblockplusui-nightlies/). See [#119 - ABP UI Nightlies](https://gitlab.com/eyeo/adblockplus/abpui/adblockplusui/issues/119) for more information.

Directory structure
-------------------

* Top-level files:
  * `firstRun.html` and `firstRun.js`: First-run page, see below
  * `i18n.js`: Localization functions, should be included by all pages.
  * `background.html`, `background.js`: Test implementation of the background
    page, should *not be imported*.
  * `desktop-options.html`, `desktop-options.js`: Options page, see below
  * `subscriptions.xml`: Test subscription data, should *not be imported*
  * `polyfill.js`: Browser API polyfills, should *not be imported*
* `js` directory: new CommonJS modules/entry-points bundled to produce
  top level pages. As example, `js/desktop-options.js` produces
  `./desktop-options.js` [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE)
  deployed within the extension.
* `lib` directory: Modules to be used on the background page to expose
  UI-related functionality.
* `locale` directory: Localized strings, with one directory per locale. The
  Firefox format for locale identifiers is used (xx-YY where xx is the language
  code and YY the optional region code). The localization strings themselves are
  stored in the JSON format, like the one used by Chrome extensions. There is
  one JSON file per HTML page, file names of HTML page and JSON file should
  match.
* `skin` directory: CSS files and any additional resources (images and fonts)
  required for these.
* `ext` directory: Test implementation of the abstraction layer. This one should
  *not to be imported*, these files should rather be replaced by
  product-specific versions providing the same interface.

Testing
-------

In Firefox the HTML pages can be opened directly from the file system
and should be fully functional. Due to security restrictions in Chrome, there
you need to pass in the `--allow-file-access-from-files` command line flag when
starting the application. Alternatively, you can run `npm start` and open
the HTML pages under URL shown shown in the terminal (example: http://127.0.0.1:8080).

You can pass along to underlying [http-server](https://www.npmjs.com/package/http-server)
program any arguments via `--` as in:
```sh
npm start -- -p 5000 -c-1
```

Various aspects of the pages can be tested by setting parameters in the URL.
The only universal parameter is `locale`, e.g. `?locale=es-AR`. This parameter
overrides browser's locale which will be used by default.

Smoke Testing UI
----------------

The `./tests` folder contains essential files to test our Custom Elements
in isolation. As it is done for the `io-element` one, you need to add
at least an `io-element.js` test file and its `io-element.html` related page.

A package script entry such `"test:io-element.js"` should bundle the
resulting page/component inside the `./smoke` folder.

Please read how it's done for `io-element` to know more.

Styled Components
-----------------

If a component depends in its CSS style in order to properly setup,
it can use the `this.isStyled()` method if the following convention is used:

```css
/* generic component CSS root definition */
io-generic-component
{
  --io-generic-component: ready;
}
```

Only once that file and its property has been parsed the call to `this.isStyled()` returns true
and you can delay initialization until such property is known.


Linting
-------

You can lint all options via `npm run lint`.

You can also run specific target linting via `npm run $ lint.js` or, once available, via `npm run $ lint.css`.

Remember, both `eslint` and `stylelint` can help fixing issues via `--fix` flag.

You can try as example via [npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b)
which should be provided automatically when you install `npm`.

```sh
npx stylelint --fix skin/real-file-name.css
```

Bundling JS or CSS
------------------

As it is for the `desktop-options` case, bundling is done via `package.json`
script entries handled by `$` namespace and shortcut.

Such shortcut gives us easy access to all scripts
defined within the `$` entry, and normalized per macOS / Linux / Windows envs.

```js
"bundle": {
  "desktop-options": {
    "js": [
      "eslint js/desktop-options.js",
      "$ create.js js/desktop-options.js desktop-options.js"
    ],
    "css": "$ create.css desktop-options"
  }
}
```

When omitted, all properties will be executed so that `npm run $ bundle.desktop-options` will pass through `.js` and `.css`.


Optimizing Assets
-----------------

The `package.json` comes with dev dependencies such as [svgo](https://www.npmjs.com/package/svgo) or [pngquant](https://www.npmjs.com/package/pngquant).

In order to optimize an entry you can either use `npm run optimize.svg skin/icons/abp-logo.svg` for SVGs, or `npm run optimize.png skin/icons/abp-128.png` for PNGs.


Watching
--------

While developing, it is convenient to bundle automatically
each time a source file is changed.

As a team, we agreed on restructuring JS and CSS code inside the js folder,
so that is watched, and each bundled created, every time there is a changes.

Simply `npm run watch` to start watching for all changes.

Translations
------------

Translations for the strings in this project are managed using the online
[Crowdin platform][crowdin]. To synchronise with Crowdin use commands
below:
- `CROWDIN_API_KEY="1111" npm run $ crowdin.upload-strings`
  - Pushes all master(en_US) files to crowdin
- `CROWDIN_API_KEY="1111" npm run $ crowdin.download-translations`
  - Downloads translation updates from the Crowdin
  - And generate fonts (see [Fonts generation](#fonts-generation))
- `CROWDIN_API_KEY="1111" npm run $ crowdin.upload-translations`
  - Pushes the translations to the crowdin

**Note:** Use actual Crowdin project key instead of "1111".

Translations CSV exporter
-------------------------

Translation agencies are using CSVs for translating priority language strings.
CSV exporter helps keeping that files in sync with the project. 

- `npm run csv-export -- [HASH]` - Uses old commit hash to create a CSV file
  with the source string differences
- `npm run csv-import -- [FILEPATH]` - Imports translations from the CSV file

Format of the exported CSV files:

| Type     | Filename     | StringID | Description          | Placeholders                | en_US         | af         | am  | ... |
|----------|--------------|----------|----------------------|-----------------------------|---------------|------------|-----|-----|
| Modified | options.json | cancel   | Cancel button label  |                             | Cancel        | Kanselleer | ይቅር | ... |
| Added    | options.json | domain   | Domain input example | {"domain":{"content":"$1"}} | e.g. $domain$ |            |     | ... |

Fonts generation
----------------

`npm run fonts-gen` - Generates font subsets and css file with `@font-face`
  and `:lang()` rules using unicode ranges extracted from extension locales.

See `build/font-generation/config.js` for the script configuration.

firstRun.html
-------------

This is the implementation of the Adblock Plus first-run page that will show up
whenever changes are applied automatically to user's Adblock Plus configuration.
This will usually happen when the user first installs Adblock Plus (initial
setup), but it can also happen in case the user's settings get lost.

To aid testing, the behavior of this page is affected by a number of URL
parameters:

* `platform`, `platformVersion`, `application`, `applicationVersion`: sets
  application parameters that are normally determined by Adblock Plus.
* `dataCorrupted`, `filterlistsReinitialized`: setting these parameters to
  `true` should trigger warnings referring to issues detected by Adblock Plus.
* `blockedURLs`: a comma-separated list of URLs that should be considered
  blocked (necessary to test the check for blocked scripts in sharing buttons).

mobile-options.html
-------------------

This is a web extension implementation of the Adblock Plus for Firefox Mobile
options page.

To aid testing, the behavior of this page is affected by a number of URL
parameters:

* `addSubscription=true`: triggers a dialog for adding
  subscriptions as initiated by clicking on an "abp:subscribe" link (use
  `title-none` or `title-url` as its value for links that don't include a title)
* `showPageOptions=true`: shows page-specific options

desktop-options.html
--------------------

This is the implementation of the Adblock Plus options page which is
the primary UI for changing settings and for managing filter lists.

To aid testing, the behavior of this page is affected by a number of URL
parameters:

* `addonVersion`: sets addon version application parameter that is used for
  creating the link to the version-specific release notes
* `addSubscription=true`: triggers a dialog for adding
  subscriptions as initiated by clicking on an "abp:subscribe" link (use
  `title-none` or `title-url` as its value for links that don't include a title)
* `additionalSubscriptions`: A comma-separated list of subscription URLs that
  simulates scenario of persistent filter lists preinstalled by administrators.
* `filterError=true`: causes filter validation to fail, showing validation
  errors when adding new filters on the options page
* `blockedURLs`: a comma-separated list of URLs that should be considered
  blocked (necessary to test the check for blocked scripts in sharing buttons).
* `downloadStatus`: sets downloadStatus parameter for filter lists, can be used
  to trigger various filter list download errors
* `platform=chromium`: shows the opt-out for the developer tools panel

issue-reporter.html?1
---------------------

This is the implementation of the Adblock Plus issue reporter which collects
data for reporting an issue to adblockplus.org.

[crowdin]: https://crowdin.com
