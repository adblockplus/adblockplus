"use strict";

// Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1408996
let ext = window.ext; // eslint-disable-line no-redeclare

// Firefox 55 erroneously sends messages from the content script to the
// devtools panel:
// https://bugzilla.mozilla.org/show_bug.cgi?id=1383310
// As a workaround, listen for messages only if this isn't the devtools panel.
// Note that Firefox processes API access lazily, so browser.devtools will
// always exist but will have undefined as its value on other pages.
if (!browser.devtools)
{
  // Listen for messages from the background page.
  browser.runtime.onMessage.addListener((message, sender) =>
  {
    let responses = ext.onMessage._dispatch(message, {});
    return ext.getMessageResponse(responses);
  });
}
