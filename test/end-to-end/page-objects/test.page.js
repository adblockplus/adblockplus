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

const BasePage = require("./base.page");

class TestPage extends BasePage
{
  constructor(browser)
  {
    super();
    this.browser = browser;
  }

  get _progress()
  {
    return $("[data-progress='done']");
  }

  async init()
  {
    await (await this._progress).waitForExist({timeout: 10000});
  }

  async getFailureCountText()
  {
    return (await $("#mocha-stats .failures > em")).getText();
  }

  async getFailureDescriptionsText()
  {
    const failureElements = await $$(".fail > h2, .fail .error");
    const descriptions = await Promise.all(
      failureElements.map((element) => element.getText())
    );
    return descriptions.join(", ");
  }

  async getSuccessCountText()
  {
    return (await $("#mocha-stats .passes > em")).getText();
  }
}

module.exports = TestPage;
