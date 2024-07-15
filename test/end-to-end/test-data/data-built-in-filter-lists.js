/* eslint-disable max-len */
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

"use strict";

const defaultFilterLists = [
  {
    flName: "PREMIUM: Distraction Control",
    flId: "Premium - Distraction Control (Block more distractions)",
    flStatus: "not present"
  },
  {
    flName: "PREMIUM: Block cookie consent",
    flId: "Premium - Block cookie consent pop-ups (Block cookie consent pop-ups)",
    flStatus: "not present"
  },
  {
    flName: "Acceptable Ads",
    flId: "Allow nonintrusive advertising",
    flStatus: "not present"
  },
  {
    flName: "Snippets",
    flId: "ABP filters (ABP Anti-Circumvention Filter List)",
    flStatus: "present"
  },
  {
    flName: "IDCAC",
    flId: "I don't care about cookies",
    flStatus: "present"
  },
  {
    flName: "Fanboy's Notifications",
    flId: "Fanboy's Notifications Blocking List (Block push notifications)",
    flStatus: "present"
  },
  {
    flName: "Easy Privacy",
    flId: "EasyPrivacy (Block additional tracking)",
    flStatus: "present"
  },
  {
    flName: "Fanboy's Social Blocking",
    flId: "Fanboy's Social Blocking List (Block social media icons tracking)",
    flStatus: "present"
  },
  {
    flName: "Indo Easylist",
    flId: "ABPindo+EasyList (Bahasa Indonesia, Melayu + English)",
    flStatus: "present"
  },
  {
    flName: "Vietnam Easylist",
    flId: "ABPVN List+EasyList (Tiếng Việt + English)",
    flStatus: "present"
  },
  {
    flName: "Bulgarian Easylist",
    flId: "Bulgarian list+EasyList (български + English)",
    flStatus: "present"
  },
  {
    flName: "Nordic Easylist",
    flId: "Dandelion Sprout's Nordic Filters+EasyList (norsk, dansk, íslenska, føroyskt, kalaallisut, svenska, suomi + English)",
    flStatus: "present"
  },
  {
    flName: "Easylist",
    flId: "EasyList (English)",
    flStatus: "present"
  },
  {
    flName: "China Easylist",
    flId: "EasyList China+EasyList (中文 + English)",
    flStatus: "present"
  },
  {
    flName: "Czech Easylist",
    flId: "EasyList Czech and Slovak+EasyList (čeština, slovenčina + English)",
    flStatus: "present"
  },
  {
    flName: "Dutch Easylist",
    flId: "EasyList Dutch+EasyList (Nederlands + English)",
    flStatus: "present"
  },
  {
    flName: "German Easylist",
    flId: "EasyList Germany+EasyList (Deutsch + English)",
    flStatus: "present"
  },
  {
    flName: "Hebrew Easylist",
    flId: "EasyList Hebrew+EasyList (עברית + English)",
    flStatus: "present"
  },
  {
    flName: "Italy Easylist",
    flId: "EasyList Italy+EasyList (italiano + English)",
    flStatus: "present"
  },
  {
    flName: "Lithuanian Easylist",
    flId: "EasyList Lithuania+EasyList (lietuvių kalba + English)",
    flStatus: "present"
  },
  {
    flName: "Polish Easylist",
    flId: "EasyList Polish+EasyList (polski + English)",
    flStatus: "present"
  },
  {
    flName: "Portuguese Easylist",
    flId: "EasyList Portuguese+EasyList (português + English)",
    flStatus: "present"
  },
  {
    flName: "Korean Easylist",
    flId: "KoreanList+EasyList (한국어 + English)",
    flStatus: "present"
  },
  {
    flName: "Indian Easylist",
    flId: "IndianList+EasyList (অসমীয়া, বাংলা (ভারত), ગુજરાતી (ભારત), भारतीय, ಕನ್ನಡ, undefined, മലയാളം, मराठी, नेपाली, ଓଡ଼ିଆ, ਪੰਜਾਬੀ (ਭਾਰਤ), සිංහල, தமிழ், తెలుగు + English)",
    flStatus: "present"
  },
  {
    flName: "Spanish Easylist",
    flId: "EasyList Spanish+EasyList (español + English)",
    flStatus: "present"
  },
  {
    flName: "Latvian Easylist",
    flId: "Latvian List+EasyList (latviešu valoda + English)",
    flStatus: "present"
  },
  {
    flName: "Arabic Easylist",
    flId: "Liste AR+Liste FR+EasyList (العربية + English)",
    flStatus: "present"
  },
  {
    flName: "French Easylist",
    flId: "Liste FR+EasyList (français + English)",
    flStatus: "present"
  },
  {
    flName: "Romanian Easylist",
    flId: "ROList+EasyList (română + English)",
    flStatus: "present"
  },
  {
    flName: "Russian Easylist",
    flId: "RU, UA, UZ, KZ+EasyList (Русский, українська, o’zbek, Қазақ тілі + English)",
    flStatus: "present"
  },
  {
    flName: "Turkish Easylist",
    flId: "Turkish Filters+EasyList (Türkçe + English)",
    flStatus: "present"
  },
  {
    flName: "Japanese Easylist",
    flId: "Japanese Filters+EasyList (日本語 + English)",
    flStatus: "present"
  },
  {
    flName: "Hungarian Easylist",
    flId: "Hufilter Basic+EasyList (magyar + English)",
    flStatus: "present"
  },
  {
    flName: "Global Easylist",
    flId: "Global Filters+EasyList (bosanski, ελληνικά, Filipino, Hrvatski, slovenščina, српски, ภาษาไทย + English)",
    flStatus: "present"
  }
];

exports.defaultFilterLists = defaultFilterLists;
