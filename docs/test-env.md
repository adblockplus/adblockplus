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
| application | `edge` | Hides rating dialog |
| downloadStatus | `synchronize_ok` | Set filter list download status: Filter list download succeeded (default) |
| | `synchronize_connection_error` | Set filter list download status: Connection error |
| | `synchronize_invalid_data` | Set filter list download status: Invalid filter list |
| | `synchronize_invalid_url` | Set filter list download status: Filter list has invalid URL |
| | `synchronize_checksum_mismatch` | (deprecated) Set filter list download status: Checksum mismatch |
| filterError | `true` | Causes any filter validation to fail |
| platform | `chromium` | Shows opt-out for DevTools panel |

### devtools-panel.html

No parameters.

### first-run.html

| Parameter | Value | Description |
|-|-|-|
| application | `edge` | Hides Adblock Browser promotion message |
| dataCorrupted | `true` | Show data corruption message |
| filterlistsReinitialized | `true` | Show settings reinitialized message |

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

Not supported yet.

### updates.html

No parameters.
