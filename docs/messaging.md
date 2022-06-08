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
  - [getTypes](#filtersgettypes)
  - [importRaw](#filtersimportraw)
  - [isAllowlisted](#filtersisallowlisted)
  - [listen](#filterslisten)
  - [remove](#filtersremove)
  - [replace](#filtersreplace)
  - [toggle](#filterstoggle)
  - [unallowlist](#filtersunallowlist)
  - [validate](#filtersvalidate)
- prefs
  - [get](#prefsget)
  - [listen](#prefslisten)
  - [set](#prefsset)
  - [toggle](#prefstoggle)
- notifications
  - [clicked](#notificationsclicked)
  - [get](#notificationsget)
  - [seen](#notificationsseen)
- requests
  - [listen](#requestslisten)
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
  - `acceptableAdsUrl`
  - `acceptableAdsPrivacyUrl`
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

- **string** [origin] - see [known filter origins](#known-filter-origins)
- **string** text

**Response**

**[FilterError](#filtererror)[]** errors

#### filters.allowlist

**Arguments**

- **string** [origin] - see [known filter origins](#known-filter-origins)
- **boolean** singlePage - to allowlist a page instead of the whole domain
- **object** tab

#### filters.get

**Response**

**[Filter](#filter)[]** filters

#### filters.getTypes

**Response**

**string[]** types

#### filters.importRaw

**Arguments**

- **string** [origin] - see [known filter origins](#known-filter-origins)
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
  - `changed`
  - `removed`

**Response**

**[Filter](#filter)** filter

#### filters.remove

**Arguments**

- **string** text

#### filters.replace

**Arguments**

- **string** old
- **string** [origin] - see [known filter origins](#known-filter-origins)
- **string** new

**Response**

**[FilterError](#filtererror)[]** errors

#### filters.toggle

**Arguments**

- **string** text
- **boolean** disabled

#### filters.unallowlist

**Arguments**

- **object** tab
- **boolean** singlePage - to unallowlist a page instead of the whole domain

#### filters.validate

**Arguments**

- **string** text

**Response**

**[FilterError](#filtererror)[]** errors

#### Known filter origins

- `popup`
- `web`

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

### requests

#### requests.listen

**Arguments**

- **string[]** filter
  - `hits`
- **number** tabId

**Response**

- **[Target](#target)** target
- **[Filter](#filter)** filter
- **string[]** subscriptions

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
- **boolean** [ignoreDisabled]

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
  - `changed`
  - `filtersDisabled`
  - `removed`

**Response**

- **[Subscription](#subscription)** subscription
- **string** [property] (if filter is `changed`)
  - `downloading`
  - `downloadStatus`
  - `enabled`
  - `homepage`
  - `lastDownload`
  - `title`
- **boolean** newValue (if filter is `filtersDisabled`)
- **boolean** oldValue (if filter is `filtersDisabled`)


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

**object**

- **string** text

### FilterError

**object**

- **number** [lineno]
- **string** [option]
- **string** [reason]
- **string** type

### Subscription

**object**

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

### Target

- **string** docDomain
- **boolean** thirdParty
- **string** type
- **string** url

![Subscription expiration](images/subscription-expiration.svg)

[tab]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
