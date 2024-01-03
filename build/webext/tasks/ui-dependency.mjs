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
import fs from "fs";
import {promisify} from "util";
import glob from "glob";
import {exec} from "child_process";
import {Readable} from "stream";
import Vinyl from "vinyl";

const lastBuildTimeFilePath = "./dist/tmp/.last_ui_build";

async function getMTime(file)
{
  return (await fs.promises.stat(file)).mtimeMs;
}

function createBuild()
{
  // If that ever changes, please update any documentation regarding partial
  // builds!
  return (promisify(exec))("bash -c \"npm run dist\"");
}

async function mustBuildUI(lastUIBuildTime)
{
  const matches = await (promisify(glob))(
    "./{build/icons-generation}/**"
  );
  matches.push(
    "./package.json",
    "./package-lock.json"
  );

  return await new Promise((resolve, reject) =>
  {
    Promise.all(matches.map(filename =>
      getMTime(filename).then(mtime =>
      {
        if (mtime > lastUIBuildTime)
          resolve(true);
      })
    )).then(() => { resolve(false); }, reject);
  });
}

function updateLastUIBuildTime()
{
  return fs.promises.utimes(lastBuildTimeFilePath, new Date(), new Date());
}

function createLastUIBuildTime()
{
  return new Readable.from([
    new Vinyl({
      path: lastBuildTimeFilePath,
      contents: Buffer.from("")
    })
  ]).pipe(gulp.dest("."));
}

export async function buildUI(cb)
{
  let lastUIBuildTime;

  try
  {
    lastUIBuildTime = await getMTime(lastBuildTimeFilePath);
  }
  catch (e)
  {
    await createBuild();
    return createLastUIBuildTime();
  }

  if (await mustBuildUI(lastUIBuildTime))
  {
    await createBuild();
    return updateLastUIBuildTime();
  }

  return cb();
}

