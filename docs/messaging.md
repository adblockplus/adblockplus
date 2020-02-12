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
  - [get](#filtersget)
  - [importRaw](#filtersimportraw)
  - [isWhitelisted](#filtersiswhitelisted)
  - [listen](#filterslisten)
  - [remove](#filtersremove)
  - [replace](#filtersreplace)
  - [toggle](#filterstoggle)
  - [unwhitelist](#filtersunwhitelist)
  - [validate](#filtersvalidate)
  - [whitelist](#filterswhitelist)
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
- subscriptions
  - [add](#subscriptionsadd)
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
- **boolean** whitelisted

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

#### filters.isWhitelisted

**Arguments**

- **object** tab

**Response**

**object** isWhitelisted
  - **boolean** hostname
  - **boolean** page

#### filters.listen

**Arguments**

- **string[]** filter (see also `filter.*` events in [`filterNotifier`][filternotifier])
  - `loaded`

**Response**

See [`filterNotifier`][filternotifier].

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

#### filters.unwhitelist

- **object** tab
- **boolean** singlePage - to unwhitelist a page instead of the whole domain

#### filters.validate

- **string** text

**Response**

**[FilterError](#filtererror)[]** errors

#### filters.whitelist

- **object** tab
- **boolean** singlePage - to whitelist a page instead of the whole domain

---

### prefs

#### prefs.get

**Arguments**

- **string** key

**Response**

**any** value

#### prefs.listen

**Arguments**

- **string[]** filter (see [list of preferences](https://hg.adblockplus.org/adblockpluschrome/file/master/lib/prefs.js))

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

- **string** [displayMethod] - (see [`displayMethods`](https://hg.adblockplus.org/adblockpluschrome/file/master/lib/notificationHelper.js))
- (deprecated) **string** locale

**Response**

**Object** notification

#### notifications.seen

---

### stats

#### stats.getBlockedPerPage

**Arguments**

- **[Tab][tab]** tab

**Response**

- **number** blockedPage

---

### subscriptions

#### subscriptions.add

**Arguments**

- **boolean** [confirm]
- **string** [homepage]
- **string** [title]
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

- **string[]** filter (see also [`filterNotifier`][filternotifier])

**Response**

See [`filterNotifier`][filternotifier].

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

[filternotifier]: https://hg.adblockplus.org/adblockpluscore/file/master/lib/filterNotifier.js
[tab]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
