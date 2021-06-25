# Messaging API

## Usage

### General

```js
browser.runtime.sendMessage({type: name, ...}).then(msg => ...);
```

### Listeners

Listeners are all messages whose action is `listen`.

```js
let port = browser.runtime.connect({name: "ui"});
port.onMessage.addListener((msg) => ...);
port.postMessage({type: name, ...});
```

## API Reference

Naming convention: `subject` `.` `action` (e.g. `filters.get`)

- app
  - [get](#appget)
  - [listen](#applisten)
  - [open](#appopen)
- filters
  - [add](#filtersadd)
  - [allowlist](#filtersallowlist)
  - [get](#filtersget)
  - [importRaw](#filtersimportraw)
  - [isAllowlisted](#filtersisallowlisted)
  - [listen](#filterslisten)
  - [remove](#filtersremove)
  - [replace](#filtersreplace)
  - [toggle](#filterstoggle)
  - [unallowlist](#filtersunallowlist)
  - [validate](#filtersvalidate)
- filterState
  - [listen](#filterstatelisten)
- prefs
  - [get](#prefsget)
  - [listen](#prefslisten)
  - [set](#prefsset)
  - [toggle](#prefstoggle)
- notifications
  - [clicked](#notificationsclicked)
  - [get](#notificationsget)
  - [seen](#notificationsseen)
- stats
  - [getBlockedPerPage](#statsgetblockedperpage)
  - [getBlockedTotal](#statsgetblockedtotal)
  - [listen](#statslisten)
- subscriptions
  - [add](#subscriptionsadd)
  - [enableAllFilters](#subscriptionsenableallfilters)
  - [get](#subscriptionsget)
  - [getInitIssues](#subscriptionsgetinitissues)
  - [listen](#subscriptionslisten)
  - [remove](#subscriptionsremove)
  - [toggle](#subscriptionstoggle)
  - [update](#subscriptionsupdate)

---

### app

#### app.get

**Arguments**

- **string** [link] - (if "what" is `doclink`; may include `{browser}` placeholder)
- **string** what
  - `doclink`
  - `features`
  - `localeInfo`
  - `recommendations`
  - `senderId`

**Response**

**string** doclink (if "what" is `doclink`)

**object** features (if "what" is `features`)
- **boolean** devToolsPanel

**object** localeInfo (if "what" is `localeInfo`)
- **string** bidiDir
  - `ltr`
  - `rtl`
- **string** locale
  - [RFC2616](https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.10)

**object[]** recommendations (if "what" is `recommendations`)

**number** senderId (if "what" is `senderId`)

#### app.listen

**Arguments**

- **string[]** filter (see also action in [app.open](#appopen))
  - `addSubscription`

**Response**

If filter includes `addSubscription`:

- **string** [homepage]
- **string** [title]
- **string** url

If filter includes `showPageOptions`:

- **string** host
- **boolean** allowlisted

#### app.open

**Arguments**

- **string** [action]
  - `showPageOptions` (if "what" is `options`)
- **any[]** [args] - (see [app.listen](#applisten))
- **string** what
  - `options`

---

### filters

#### filters.add

**Arguments**

- **string** text

**Response**

**[FilterError](#filtererror)[]** errors

#### filters.get

**Arguments**

- **string** subscriptionUrl

**Response**

**[Filter](#filter)[]** filters

#### filters.importRaw

**Arguments**

- **boolean** [removeExisting]
- **string** text

**Response**

**[FilterError](#filtererror)[]** errors

#### filters.isAllowlisted

**Arguments**

- **object** tab

**Response**

**object** isAllowlisted
  - **boolean** hostname
  - **boolean** page

#### filters.listen

**Arguments**

- **string[]** filter
  - `added`
  - `moved`
  - `removed`
  - `loaded`

**Response**

If filter is `added`, `moved` or `removed`

- see [`filterStorage`][filterstorage]

#### filters.remove

**Arguments**

- **number** [index]
- **string** [subscriptionUrl]
- **string** text

#### filters.replace

- **string** new
- **string** old

**Response**

**[FilterError](#filtererror)[]** errors

#### filters.toggle

- **string** text
- **boolean** disabled

#### filters.unallowlist

- **object** tab
- **boolean** singlePage - to unallowlist a page instead of the whole domain

#### filters.validate

- **string** text

**Response**

**[FilterError](#filtererror)[]** errors

#### filters.allowlist

- **object** tab
- **boolean** singlePage - to allowlist a page instead of the whole domain

---

### filterState

#### filterState.listen

**Arguments**

- **string[]** filter
  - `enabled`
  - `hitCount`
  - `lastCount`

**Response**

See [`filterState`][filterstate]

---

### prefs

#### prefs.get

**Arguments**

- **string** key

**Response**

**any** value

#### prefs.listen

**Arguments**

- **string[]** filter (see [list of preferences](https://gitlab.com/eyeo/adblockplus/adblockpluschrome/-/blob/master/lib/prefs.js))

#### prefs.set

**Arguments**

- **string** key
- **any** value

**Response**

**any** newValue

#### prefs.toggle

**Arguments**

- **string** key

**Response**

- **any** newValue

---

### notifications

#### notifications.clicked

**Arguments**

- **string** id - notification ID
- **string** [link] - documentation link ID or abp-URI

#### notifications.get

**Arguments**

- **string** [displayMethod] - (see [`displayMethods`](https://gitlab.com/eyeo/adblockplus/adblockpluschrome/-/blob/master/lib/notificationHelper.js))
- (deprecated) **string** locale

**Response**

**object** notification

#### notifications.seen

---

### stats

#### stats.getBlockedPerPage

**Arguments**

- **[Tab][tab]** tab

**Response**

- **number** blockedPageCount

#### stats.getBlockedTotal

**Response**

- **number** blockedTotalCount

#### stats.listen

**Arguments**

- **string[]** filter
  - `blocked_per_page`
  - `blocked_total`

**Response**

If filter includes `blocked_per_page`:

- **object** newBlockedPage
  - **number** tabId
  - **number** blocked

If filter includes `blocked_total`:

- **number** newBlockedTotal

---

### subscriptions

#### subscriptions.add

**Arguments**

- **boolean** [confirm]
- **string** [homepage]
- **string** [title]
- **string** url

#### subscriptions.enableAllFilters

**Arguments**

- **string** url

#### subscriptions.get

**Arguments**

- **boolean** [disabledFilters]
- **boolean** [downloadable]
- **boolean** [ignoreDisabled]
- **boolean** [special]

**Response**

**[Subscription](#subscription)[]** subscriptions
- **string[]** disabledFilters

#### subscriptions.getInitIssues

**Response**

**object** issues
- **boolean** dataCorrupted
- **boolean** reinitialized

#### subscriptions.listen

**Arguments**

- **string[]** filter
  - `added`
  - `disabled`
  - `downloading`
  - `downloadStatus`
  - `errors`
  - `filtersDisabled`
  - `fixedTitle`
  - `homepage`
  - `lastCheck`
  - `lastDownload`
  - `removed`
  - `title`
  - `updated`

**Response**

If filter is `added`, `removed` or `updated`

- see [`filterStorage`][filterstorage]

If filter is `disabled`, `downloadStatus`, `errors`, `fixedTitle`, `homepage`, `lastCheck`, `lastDownload` or `title`

- see [`subscriptionClasses`][subscriptionclasses]

If filter is `downloading`

- see [`synchronizer`][synchronizer]

If filter is `filtersDisabled`

- see [`filterConfiguration`][filterconfiguration]

#### subscriptions.remove

**Arguments**

- **string** url

#### subscriptions.toggle

**Arguments**

- **boolean** [keepInstalled]
- **string** url

#### subscriptions.update

**Arguments**

- **string** [url]

## Types

### Filter

- **string** text

### FilterError

- **number** [lineno]
- **string** [reason]
- **string** [selector]
- **string** type

### Subscription

- **boolean** disabled
- **string** downloadStatus
- **number** expires
- **string** homepage
- **number** lastDownload
- **number** lastSuccess
- **number** softExpiration
- **string** title
- **string** url
- **string** version

![Subscription expiration](images/subscription-expiration.svg)

[filterconfiguration]: ../adblockpluschrome/lib/filterConfiguration.js
[filterstate]: https://gitlab.com/eyeo/adblockplus/adblockpluscore/-/blob/master/lib/filterState.js
[filterstorage]: https://gitlab.com/eyeo/adblockplus/adblockpluscore/-/blob/master/lib/filterStorage.js
[filternotifier]: https://gitlab.com/eyeo/adblockplus/adblockpluscore/-/blob/master/lib/filterNotifier.js
[synchronizer]: https://gitlab.com/eyeo/adblockplus/adblockpluscore/-/blob/master/lib/synchronizer.js
[subscriptionclasses]: https://gitlab.com/eyeo/adblockplus/adblockpluscore/-/blob/master/lib/subscriptionClasses.js
[tab]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
