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

const {deepEqual} = require("assert").strict;
const {TestEnvironment} = require("../env");

let env;

function assertContent(input, expected)
{
  return new Promise((resolve, reject) =>
  {
    env.setModules({
      fs: {
        readFile(filepath, callback)
        {
          callback(null, JSON.stringify(input));
        },
        writeFile(filepath, content)
        {
          try
          {
            deepEqual(
              JSON.parse(content),
              expected
            );
            resolve();
          }
          catch (ex)
          {
            reject(ex);
          }
        }
      }
    });
    env.requireModule("../../build/locale-sync/normalize");
  });
}

describe("Testing locale-sync/normalize", () =>
{
  beforeEach(() =>
  {
    env = new TestEnvironment({
      globals: {},
      modules: {
        "glob": {
          glob(glob, callback)
          {
            callback(null, ["foo"]);
          }
        },
        "util": require("util"),
        "./common/config": {}
      }
    });
  });

  afterEach(() =>
  {
    env.restore();
    env = null;
  });

  it("Should remove descriptions from strings", async() =>
  {
    await assertContent(
      {
        a: {
          description: "a.description",
          message: "a.message"
        },
        b: {
          description: "b.description",
          message: "b.message"
        },
        c: {message: "c.message"}
      },
      {
        a: {message: "a.message"},
        b: {message: "b.message"},
        c: {message: "c.message"}
      }
    );
  });

  it("Should sort strings", async() =>
  {
    await assertContent(
      {
        b: {},
        a: {}
      },
      {
        a: {},
        b: {}
      }
    );
  });

  it("Should sort string placeholders", async() =>
  {
    await assertContent(
      {
        a: {
          placeholders: {
            ab: {},
            aa: {}
          }
        }
      },
      {
        a: {
          placeholders: {
            aa: {},
            ab: {}
          }
        }
      }
    );
  });
});
