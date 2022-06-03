/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

export const knownFilterText = [
  "! Exception rules",
  "@@||allowlisted-domain.com^$document",
  "@@|http://allowlisted-page.com/|$document",
  "@@|https://www.allowlisted-page.com/foo/bar.baz?$document",
  `@@|https://allowlisted-page.com${"/foo".repeat(20)}|$document`,
  "@@||example.com/looks_like_an_ad_but_isnt_one.html",
  "! Blocking rules",
  "||biglemon.am/bg_poster/banner.jpg",
  "/ad_banner*$domain=example.com",
  "||example.com/some-annoying-popup$popup",
  "/(example\\.com\\/some-annoying-popup\\)$/$rewrite=$1?nopopup",
  "! Hiding rules",
  "winfuture.de###header_logo_link",
  "###WerbungObenRechts10_GesamtDIV",
  "###WerbungObenRechts8_GesamtDIV",
  "###WerbungObenRechts9_GesamtDIV",
  "###WerbungUntenLinks4_GesamtDIV",
  "###WerbungUntenLinks7_GesamtDIV",
  "###WerbungUntenLinks8_GesamtDIV",
  "###WerbungUntenLinks9_GesamtDIV",
  "###Werbung_Sky",
  "###Werbung_Wide",
  "###__ligatus_placeholder__",
  "###ad-bereich1-08",
  "###ad-bereich1-superbanner",
  "###ad-bereich2-08",
  "###ad-bereich2-skyscrapper",
  "example.com##.ad_banner"
];

export const filterTypes = new Set([
  "BACKGROUND",
  "CSP",
  "DOCUMENT",
  "DTD",
  "ELEMHIDE",
  "FONT",
  "GENERICBLOCK",
  "GENERICHIDE",
  "IMAGE",
  "MEDIA",
  "OBJECT",
  "OBJECT_SUBREQUEST",
  "OTHER",
  "PING",
  "POPUP",
  "SCRIPT",
  "STYLESHEET",
  "SUBDOCUMENT",
  "WEBRTC",
  "WEBSOCKET",
  "XBL",
  "XMLHTTPREQUEST"
]);
