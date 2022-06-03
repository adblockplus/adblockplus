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

import {$, $$} from "../../dom";

// both components are needed,
// and handled, by this file
import "../../io-steps";
import "../../io-highlighter";

// managers are invoked right away
// but their initialization might be asynchronous
const managers = [
  // first screen, the welcome one
  // as soon as one radiobox is selected
  // the user can move forward
  ({ioSteps, page, index}) =>
  {
    page.addEventListener("change", event =>
    {
      ioSteps.setCompleted(index, true);
      enableContinue();
    });
  },

  // screenshot page, with highlight and hide ability
  // the canvas need to be visible to have a meaningful
  // computed with or height so the component itself
  // is injected only after the page has been selected
  // for the very first time only
  ({ioSteps, page, index, screenshot}) =>
  {
    // setup only first time is visible
    ioSteps.addEventListener("step:click", function once(event)
    {
      if (event.detail !== index)
        return;
      ioSteps.removeEventListener(event.type, once);
      const ioHighlighter = document.createElement("io-highlighter");
      page.appendChild(ioHighlighter);
      ioHighlighter.edit(screenshot);
      ioSteps.setCompleted(index, true);
      enableContinue();
    });
  },

  // third page, optional extra details where
  // the user can move on only if a valid email
  // is entered or the anonymous checkbox is used
  ({ioSteps, page, index}) =>
  {
    Promise.all([
      new Promise(resolve =>
      {
        ioSteps.addEventListener("requestcollected", resolve);
      }),
      new Promise(resolve =>
      {
        ioSteps.addEventListener("formvalidated", event =>
        {
          ioSteps.setCompleted(index, event.detail);
          $("button:last-child", ioSteps).disabled = true;
          if (event.detail)
            resolve();
        });
      })
    ]).then(() =>
    {
      $("#continue").hidden = true;
      $("#send").hidden = false;
    });
  },

  // last page, the sending of the report
  ({ioSteps, page, index, resolve}) =>
  {
    ioSteps.addEventListener("step:click", function once(event)
    {
      ioSteps.removeEventListener(event.type, once);
      const ioHighlighter = $("io-highlighter");
      ioHighlighter.changeDepth.then(() =>
      {
        resolve({
          screenshot:
          {
            get edited()
            {
              return ioHighlighter.edited;
            },
            get data()
            {
              return ioHighlighter.toDataURL();
            }
          }
        });
      });
    });
  }
];

const stepManager = ({screenshot}) => new Promise(resolve =>
{
  const ioSteps = $("io-steps");
  const pages = $$("main > .page");
  const btnContinue = $("#continue");
  let currentPage = pages[0];
  let index = 0;
  ioSteps.addEventListener(
    "step:click",
    event =>
    {
      index = event.detail;
      const nextPage = pages[index];
      if (nextPage === currentPage)
        return;
      currentPage.hidden = true;
      currentPage = nextPage;
      currentPage.hidden = false;
      // allow users to click previous section that might be
      // already completed so that there's no reason to disable
      // the continue button
      btnContinue.disabled = !ioSteps.getCompleted(index);
    }
  );
  btnContinue.addEventListener(
    "click",
    event =>
    {
      ioSteps.dispatchEvent(
        new CustomEvent("step:click", {detail: index + 1})
      );
    }
  );
  managers.forEach((setup, i) =>
  {
    setup({ioSteps, page: pages[i], index: i, resolve, screenshot});
  });
});

function enableContinue()
{
  $("#continue").disabled = false;
}

export default stepManager;
