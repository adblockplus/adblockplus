# Testing Adblock Plus UI Components

All components should have a corresponding
_component-name.html_ file to reach and test
via all our target browsers.

Such file should contain all the necessary to
bootstrap ABP UI like environment and test such component.


## component-name.test.js

This should be file loaded, as deferred, at the bottom
of _component-name.html_ scripts list.

The file should, at least, include the component it's testing.

Example:

```js
/* globals module, require */

"use strict";

const IOParagraph = require("../js/io-paragraph");

document.body.appendChild(
  new IOParagraph("some content")
);
```


## bundle & test via package.json

Once there is a `.test` file, ensure it's built properly
like it is, as example, for the `test:io-element.js` case.

Ensure the built target is, as example, `tests/io-paragraph.js`,
and add `npm run test:io-paragraph.js` to the generic
`test` entry in the _package.json_ file.

`npm test` should build and bundle all tests, but we want
to be able to test a single component too.


## test on browsers
Simply run `npm start` and reach `localhost:XXXX/tests` folder
with all target browsers you need to verify the component.
