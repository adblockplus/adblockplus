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
import {initI18n, setElementLinks, setElementText} from "../i18n";

function openOptions()
{
  api.app.open("options");
}

function initLinks()
{
  Promise.all([
    api.doclinks.get("acceptable_ads_criteria"),
    api.doclinks.get("acceptable_ads_opt_out")
  ]).then(([urlCriteria, urlOptOut]) =>
  {
    setElementLinks("control-description", urlCriteria, urlOptOut, openOptions);
  });

  api.doclinks.get("terms").then((url) =>
  {
    setElementLinks("fair-description", url);
  });
  api.doclinks.get("eyeo").then((url) =>
  {
    const year = new Date().getFullYear().toString();
    const notice = document.getElementById("copyright-notice");
    setElementText(notice, "common_copyright", year);
    setElementLinks("copyright-notice", url);
  });
}

function initWarnings()
{
  api.subscriptions.getInitIssues()
    .then((issues) =>
    {
      const {dataCorrupted, reinitialized} = issues;
      const warnings = [];

      // Show warning if we detected some data corruption
      if (dataCorrupted)
      {
        warnings.push("dataCorrupted");
        api.doclinks.get("adblock_plus").then((url) =>
        {
          setElementLinks("dataCorrupted-reinstall", url);
        });
        api.doclinks.get("help_center").then((url) =>
        {
          setElementLinks(
            "dataCorrupted-support",
            "mailto:support@adblockplus.org",
            url
          );
        });
      }
      // Show warning if filterlists settings were reinitialized
      else if (reinitialized)
      {
        warnings.push("reinitialized");
        setElementLinks("warning-reinitialized", openOptions);
      }

      // While our design isn't optimized for it yet, multiple warnings can
      // be shown by adding multiple strings the body's data-warnings attribute
      if (warnings.length)
      {
        document.body.dataset.warnings = warnings.join(" ");
      }
    });
}

function initApplication()
{
  api.app.get("application").then((application) =>
  {
    document.documentElement.dataset.application = application;
  });
}

convertDoclinks();
initI18n();
initLinks();
initWarnings();
initApplication();
