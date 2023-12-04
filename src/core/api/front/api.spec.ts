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

import { app } from "./api";

describe("app", () => {
  describe("get", () => {
    it("should send the correct type", () => {
      const sendRuntimeMessageSpy = jest.spyOn(browser.runtime, "sendMessage");

      const what = "applicationVersion";
      void app.get(what);

      expect(sendRuntimeMessageSpy).toHaveBeenCalledTimes(1);
      expect(sendRuntimeMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "app.get"
        })
      );

      sendRuntimeMessageSpy.mockRestore();
    });
  });
});
