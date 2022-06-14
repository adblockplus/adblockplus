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

import api from "../api";
import {convertDoclinks} from "../common";
import {$} from "../dom";
import {initI18n} from "../i18n";

import "../landing";

api.app.getInfo().then((info) =>
{
  document.body.dataset.application = info.application;

  api.doclinks.get(`${info.store}_store`).then((url) =>
  {
    $("#store-link").href = url;
  });
});

function initOSReference(name, idx)
{
  const element = $(`#solution em[data-i18n-index="${idx}"]`);
  element.classList.add("os", name);
  element.title = browser.i18n.getMessage(`problem_os_${name}`);
}

convertDoclinks();
initI18n();
["windows", "mac"].forEach(initOSReference);
