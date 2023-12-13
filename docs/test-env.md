# Test Environment

## URL Parameters

### Global

| Parameter | Value | Description |
|-|-|-|
| application | String | Used for resolving application-specific documentation links (e.g. "chrome_support") |
| locale | String | Show page using given locale (see [list of supported locales](../locale)) |

### composer.html

Not supported yet.

### day1.html

No parameters.

### desktop-options.html

| Parameter | Value | Description |
|-|-|-|
| additionalSubscriptions | Filter list URLs (separated by `,`) | Preconfigure filter lists as done by administrators |
| addSubscription | `true`| Show dialog for adding filter list as done using abp-subscribe links |
| | `title-none` | Show dialog as if no title or URL had been passed |
| | `title-url` | Show dialog as if no title had been passed |
| | `invalid` | Show dialog as if an invalid URL had been passed |
| application | `edge` | Hides rating dialog |
| filtersDisabled | `true` | Show dialog as if all the filters of an updatable subscription were disabled[^subscriptions-filters] |
| downloadStatus | `synchronize_ok` | Set filter list download status: Filter list download succeeded (default) |
| | `synchronize_connection_error` | Set filter list download status: Connection error |
| | `synchronize_diff_error` | Set filter list download status: Filter list diff update error |
| | `synchronize_diff_too_many_filters` | Set filter list download status: Filter list diff update too large |
| | `synchronize_invalid_data` | Set filter list download status: Invalid filter list |
| | `synchronize_invalid_url` | Set filter list download status: Filter list has invalid URL |
| | `synchronize_checksum_mismatch` | (deprecated) Set filter list download status: Checksum mismatch |
| filterError | `string` | Causes any filter validation to fail to specific filter error (e.g. `invalid_csp`, `unknown_option`) |
| filterOption | `string` | Invalid option of `unknown_option` filter validation error |
| includeUnknownSubscription | `true` | Preinstall non-recommended subscription |
| platform | `chromium` | Shows opt-out for DevTools panel |
| premiumIsActive | `true` | Sets premium license as active |

If the `locale` uses any Chinese that starts with `zh`, the _Get in touch_ section under the _Help_ tab should show social media icons different from Facebook and Twitter, as these platform are not available for Chinese users.

It's possible to trigger multiple errors at the same time, e.g. using `filtersDisabled` and `downloadStatus` parameters.

[^subscriptions-filters]: Not all updatable subscriptions would contain filters, look for the `filterText` property in the [subscription data list](../mocks/js/config/subscriptions.js).

### devtools-panel.html

No parameters.

### first-run.html

| Parameter | Value | Description |
|-|-|-|
| application | `edge` | Hides Adblock Browser promotion message |
| dataCorrupted | `true` | Show data corruption message |
| reinitialized | `true` | Show settings reinitialized message |

### issue-reporter.html

| Parameter | Value | Description |
|-|-|-|
| 1 | (none) | Set ID of tab the issue reporter refers to (required) |

### mobile-options.html

| Parameter | Value | Description |
|-|-|-|
| addSubscription | `true`| Show dialog for adding filter list as done using abp-subscribe links |
| | `title-none` | Show dialog as if no title or URL had been passed |
| | `title-url` | Show dialog as if no title had been passed |
| showPageOptions | `true` | Show page-specific options |

### popup.html

| Parameter | Value | Description |
|-|-|-|
| application | `edge` | Hides Adblock Browser promotion message |
| composerActive | `false` | Hides button to open filter composer |
| domainAllowlisted | `true` | Shows popup as if domain is allowlisted |
| notification | `critical` | Show notification with "critical" type |
| | `default` | Show notification with unknown type |
| | `information` | Show notification with "information" type |
| pageAllowlisted | `true` | Show popup as if page is allowlisted |
| platform | `edgehtml` | Hides button to open issue reporter |
| pageURL | `https%3A%2F%2Fexample.com%2F` | Sets the displayed URL in the popup to the given value (the given value must be URL-encoded) |
| | `chrome%3A%2F%2Fextensions` | The UI will only display stats, as ABP is not active on built-in browser pages |

If the `locale` uses any Chinese that starts with `zh`, the _Share numbers with friends_ should either be invisible, or it should show social media icons different from Facebook and Twitter, as these platform are not available for Chinese users.

### popup-dummy.html

No parameters.

### problem.html

| Parameter | Value | Description |
|-|-|-|
| application | `edge` | Shows instructions for Edge (overrules platform) |
| | `opera` | Shows instructions for Opera (overrules platform) |
| platform | `chromium` | Shows instructions for Chromium-based browsers |
| | `edgehtml` | Shows instructions for EdgeHTML-based browsers |
| | `gecko` | Shows instructions for Gecko-based browsers |

### updates.html

| Parameter | Value | Description |
|-|-|-|
| application | `edge` | Hides rating section |
