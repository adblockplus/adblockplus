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

Directory structure
-------------------

* Top-level files:
  * `firstRun.html` and `firstRun.js`: First-run page, see below
  * `i18n.js`: Localization functions, should be included by all pages.
  * `messageResponder.js`: Script to be used on the background page to respond
    to messages sent by UI code.
  * `background.html`, `background.js`: Test implementation of the background
    page, should *not be imported*.
  * `desktop-options.html`, `desktop-options.js`: Options page, see below
  * `subscriptions.xml`: Test subscription data, should *not be imported*
  * `polyfill.js`: Browser API polyfills, should *not be imported*
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

Linting
-------

You can lint all options via `npm run lint`.

You can also run specific target linting via `npm run lint:js` or, once available, via `npm run lint:css`.

Remember, both `eslint` and `stylelint` can help fixing issues via `--fix` flag.

You can try as example via [npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b)
which should be provided automatically when you install `npm`.

```sh
npx stylelint --fix skin/real-file-name.css
```

Translations
------------

Translations for the strings in this project are managed using the online
[Crowdin platform][crowdin]. To synchronise with Crowdin you can use the build
script. To get a list of the possible commands type `./build.py help` at
the command line. (You will also need the Crowdin API key for the project.)

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
* `filterlistsReinitialized`: setting these parameters to `true` should
  trigger warnings referring to issues detected by Adblock Plus.
* `blockedURLs`: a comma-separated list of URLs that should be considered
  blocked (necessary to test the check for blocked scripts in sharing buttons).

mobile-options.html
------------

This is a web extension implementation of the Adblock Plus for Firefox Mobile
options page.

To aid testing, the behavior of this page is affected by a number of URL
parameters:

* `addSubscription=true`: this parameter should trigger a dialog for adding
  subscriptions as initiated by clicking on an "abp:subscribe" link
* `showPageOptions=true`: shows page-specific options

desktop-options.html
------------

This is the implementation of the Adblock Plus options page which is
the primary UI for changing settings and for managing filter lists.

To aid testing, the behavior of this page is affected by a number of URL
parameters:

* `addonVersion`: sets addon version application parameter that is used for
  creating the link to the version-specific release notes
* `addSubscription=true`: this parameter should trigger a dialog for adding
  subscriptions as initiated by clicking on an "abp:subscribe" link
* `filterError=true`: causes filter validation to fail, showing validation
  errors when adding new filters on the options page
* `blockedURLs`: a comma-separated list of URLs that should be considered
  blocked (necessary to test the check for blocked scripts in sharing buttons).
* `downloadStatus`: sets downloadStatus parameter for filter lists, can be used
  to trigger various filter list download errors
* `platform=chromium`: shows the opt-out for the developer tools panel
* `showNotificationUI=true`: simulates user having opted-out of notifications


[crowdin]: https://crowdin.com
