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

import gulp from "gulp";
import mergeTranslations from "../utils/gulp-merge-translations.js";
import changePath from "../utils/gulp-change-path.js";

export function translations(locales)
{
  // Excluding files in parent directory doesn't work in Gulp so we need
  // to avoid this scenario by setting the current working directory to
  // the parent directory.
  // https://github.com/gulpjs/gulp/issues/2211
  return gulp.src(locales.src, {cwd: ".."})
    .pipe(mergeTranslations(
      {
        fileName: "messages.json"
      }))
    .pipe(changePath(locales.dest, {cwd: ".."}));
}

function getRequiredInfo(manifest)
{
  let result = {};
  let limits = {
    name: 12,
    name_releasebuild: 45,
    name_devbuild: 45,
    description: 132
  };

  result.fields = Object.values(manifest)
    .filter(value => typeof value == "string" && value.match("__MSG"))
    .map(name =>
    {
      let parsed = name.replace(/(__MSG_)|(__)/g, "");
      return {
        name: parsed,
        limit: limits[parsed]
      };
    });

  result.locale = manifest["default_locale"];

  return result;
}

export function chromeTranslations(locales, manifest)
{
  // Excluding files in parent directory doesn't work in Gulp so we need
  // to avoid this scenario by setting the current working directory to
  // the parent directory.
  // https://github.com/gulpjs/gulp/issues/2211
  return gulp.src(locales.src, {cwd: ".."})
    .pipe(mergeTranslations(
      {
        fileName: "messages.json",
        defaults: getRequiredInfo(manifest)
      }))
    .pipe(changePath(
      locales.dest,
      {
        cwd: "..",
        match: /es_MX/g,
        replace: "es_419"
      }
    ));
}
