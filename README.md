Shared Adblock Plus UI code
===========================

The user interface elements defined in this repository will be used by various
Adblock Plus products like Adblock Plus for Firefox. Their functionality can be
tested within this repository, even though they might not work exactly the same
as they will do in the final product.

Directory structure
-------------------

* Top-level files:
  * `firstRun.html` and `firstRun.js`: First-run page, see below
  * `i18n.js`: Localization functions, should be included by all pages.
  * `messageResponder.js`: Script to be used on the background page to respond
    to messages sent by UI code.
  * `background.html`, `background.js`: Test implementation of the background
    page, should *not be imported*.
  * `new-options.html`, `new-options.js`: Options page, see below
  * `subscriptions.xml`: Test subscription data, should *not be imported*
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
starting the application. Alternatively, you can run `test_server.py` (requires
Python 2.7) and open the HTML pages under URLs like
`http://127.0.0.1:5000/firstRun.html`.

Various aspects of the pages can be tested by setting parameters in the URL. The
only universal parameter is `locale`, e.g. `?locale=es-AR`. This parameter
overrides browser's locale which will be used by default.

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

new-options.html
------------

This is the new implementation of the Adblock Plus options page which will be
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

Linting
-------

You can lint the code using [ESLint](http://eslint.org).

    eslint *.js lib ext

You will need to set up ESLint and our configuration first, see
[eslint-config-eyeo](https://hg.adblockplus.org/codingtools/file/tip/eslint-config-eyeo)
for more information.
