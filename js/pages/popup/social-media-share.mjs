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

const shareURL = "https://adblockplus.org/";

const messageMark = Symbol("messageMark");

const shareLinks = {
  // API https://developers.facebook.com/docs/sharing/reference/feed-dialog
  facebook: ["https://www.facebook.com/dialog/feed", {
    app_id: "475542399197328",
    display: "page",
    link: shareURL,
    // API https://developers.facebook.com/docs/sharing/reference/share-dialog
    hashtag: messageMark
  }],
  // API https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/guides/web-intent
  twitter: ["https://twitter.com/intent/tweet", {
    text: messageMark,
    url: shareURL,
    via: "AdblockPlus"
  }],
  // API
  weibo: ["http://service.weibo.com/share/share.php", {
    title: messageMark,
    url: shareURL
  }]
};

const shareLinksContent = {
  facebook(blockedCount)
  {
    if (blockedCount < 1000)
      return "#AdblockPlus100";

    if (blockedCount < 10000)
      return "#AdblockPlus1000";

    if (blockedCount < 100000)
      return "#AdblockPlus10K";

    if (blockedCount < 1000000)
      return "#AdblockPlus100K";

    return "#AdblockPlus1M";
  },
  twitter(blockedCount)
  {
    return browser.i18n.getMessage(
      "share_on_twitter_message",
      [blockedCount.toLocaleString()]
    );
  },
  weibo(blockedCount)
  {
    return browser.i18n.getMessage(
      "share_on_weibo_message",
      [blockedCount.toLocaleString()]
    );
  }
};

export function createShareLink(network, blockedCount)
{
  const [url, params] = shareLinks[network];

  const searchParams = new URLSearchParams();
  for (const key in params)
  {
    let value = params[key];
    if (value == messageMark)
      value = shareLinksContent[network](blockedCount);

    searchParams.append(key, value);
  }
  return url + "?" + searchParams;
}
