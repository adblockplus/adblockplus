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
import tar from "gulp-tar";
import gzip from "gulp-gzip";
import {lsFiles} from "../utils/git.js";

export default async function sourceDistribution(filename)
{
  let sourceFiles = await lsFiles();
  // Excluding files in parent directory doesn't work in Gulp so we need
  // to avoid this scenario by setting the current working directory to
  // the parent directory.
  // https://github.com/gulpjs/gulp/issues/2211
  return gulp.src(sourceFiles, {base: "..", cwd: ".."})
    .pipe(tar(`${filename}.tar`))
    .pipe(gzip())
    .pipe(gulp.dest(process.cwd()));
}
