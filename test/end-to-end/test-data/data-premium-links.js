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

const linksFreeUsers = [
  {
    testName: "Options page - Learn more",
    page: "Header",
    async clickOnLink(pageObject)
    {
      await pageObject.clickLearnMorePremiumLink();
    },
    source: "desktop-options"
  },
  {
    testName: "Options page - Upgrade button in header",
    page: "Header",
    async clickOnLink(pageObject)
    {
      await pageObject.clickUpgradeButton();
    },
    source: "desktop-options"
  },
  {
    testName: "Options page - Upgrade button in General",
    page: "Options",
    async clickOnLink(pageObject)
    {
      await pageObject.clickUpgradeButtonGeneral();
    },
    source: "general-tab"
  },
  {
    testName: "Popup - Upgrade button",
    page: "Popup",
    async clickOnLink(pageObject)
    {
      await pageObject.clickUpgradeButton();
    },
    source: "popup"
  }
];

const linksPremiumUsers = [
  {
    testName: "Options page - Manage my subscription",
    async clickOnLink(pageObject)
    {
      await pageObject.clickManageMySubscriptionButton();
    }
  },
  {
    testName: "Options page - Premium button",
    async clickOnLink(pageObject)
    {
      await pageObject.clickPremiumButton();
    }
  }
];

exports.linksFreeUsers = linksFreeUsers;
exports.linksPremiumUsers = linksPremiumUsers;
