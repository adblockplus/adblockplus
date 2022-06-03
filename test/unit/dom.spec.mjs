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

import {equal, deepEqual} from "assert";
import {TestEnvironment} from "../env";
import basichtml from "basichtml";
import {DOMParser, XMLSerializer} from "xmldom";

import {$, $$, asIndentedString, relativeCoordinates} from "../../js/dom";

let document;
let env;

function addHtmlContent()
{
  document.documentElement.innerHTML = `
  <head></head>
  <body>
    <div>
      <h1>Header</h1>
      <p>
        inside paragraph
        <span>inside first span</span>
        <span>inside second span</span>
        inside paragraph
      </p>
    </div>
  </body>`;
}

describe("Testing dom.js API", () =>
{
  beforeEach(() =>
  {
    const window = basichtml.init({});
    document = window.document;
    const defaultGlobals = {
      window,
      browser: {
        i18n: {
          getMessage: (name, args) => `[${name}-${args}]`
        },
        runtime: {
          async getBrowserInfo()
          {
            return {name: "Chrome"};
          }
        }
      }
    };

    env = new TestEnvironment({
      globals: defaultGlobals,
      modules: {}
    });
  });

  afterEach(() =>
  {
    env.restore();
    env = null;
  });

  it("$() should return first match", () =>
  {
    addHtmlContent();
    // Note: By default, basichtml accepts only node, .class, or #id
    equal($("span", document).textContent, "inside first span");
  });

  it("$$() should return all matches", () =>
  {
    addHtmlContent();
    // Note: By default, basichtml accepts only node, .class, or #id
    const spans = $$("span", document);
    equal(spans.length, 2);
    equal(spans[0].textContent, "inside first span");
    equal(spans[1].textContent, "inside second span");
  });

  it("asIndentedString() should return string  representation of DOM", () =>
  {
    env.setGlobals({Node: basichtml.Node, XMLSerializer});

    const xml = new DOMParser().parseFromString(
      "<a attr='value'><b><c>text</c><d/></b></a>",
      "text/xml"
    );

    const result = `<a attr="value">
  <b>
    <c>
      text
    </c>
    <d/>
  </b>
</a>`;

    equal(asIndentedString(xml), result);
  });

  it("relativeCoordinates() Should return relative coordinates to the" +
    " closest positioned element", () =>
  {
    const resultA = {x: 158, y: 78};
    const eventA = {
      layerX: 158,
      layerY: 78
    };
    deepEqual(relativeCoordinates(eventA), resultA);

    const resultB = {x: 168, y: 98};
    const eventB = {
      currentTarget: {
        offsetLeft: 95,
        offsetTop: 40,
        scrollLeft: 10,
        scrollTop: 20,
        offsetParent: null
      },
      pageX: 253,
      pageY: 118
    };
    deepEqual(relativeCoordinates(eventB), resultB);
  });
});
