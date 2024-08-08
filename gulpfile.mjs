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
import argparse from "argparse";
import merge from "merge-stream";
import zip from "gulp-vinyl-zip";
import del from "del";
import * as tasks from "./build/webext/tasks/index.mjs";
import * as config from "./build/webext/config/index.mjs";
import * as configParser from "./build/webext/configParser.mjs";
import * as gitUtils from "./build/webext/utils/git.mjs";
import url from "url";

const argumentParser = new argparse.ArgumentParser({
  description: "Build the extension"
});

argumentParser.addArgument(
  ["-t", "--target"],
  {choices: ["chrome", "firefox", "local"]}
);
argumentParser.addArgument(
  ["-c", "--channel"],
  {
    choices: ["development", "release"],
    defaultValue: "release"
  }
);
argumentParser.addArgument(["-b", "--build-num"]);
argumentParser.addArgument("--config");
argumentParser.addArgument(
  ["-m", "--manifest-version"],
  {
    choices: [2, 3],
    defaultValue: 2,
    type: "int"
  }
);
argumentParser.addArgument("--manifest-path");

argumentParser.addArgument("--partial", {
  choices: ["false", "true"],
  defaultValue: "false",
  help: "A partial build skips the build steps icons, rules and UI."
});

const args = argumentParser.parseKnownArgs()[0];

const targetDir = `./dist/devenv/${args.target}`;

const buildTasks = [
  tasks.buildUI,
  buildPacked
];

const devenvTasks = [
  cleanDir,
  tasks.buildUI,
  buildDevenv
];

if (args.partial === "true")
{
  // !! IMPORTANT !!
  //
  // If the contents of this block, or the `tasks.buildUI` task itself
  // changes, please update the according documentation in the README and in
  // the CLI help text.
  //
  // for a partial build, remove tasks.buildUI from task list
  for (const taskList of [buildTasks, devenvTasks])
    taskList.splice(taskList.indexOf(tasks.buildUI), 1);
}

async function getBuildSteps(options)
{
  const translations = options.target == "chrome" ?
    tasks.chromeTranslations :
    tasks.translations;
  const buildSteps = [];
  const addonName = `${options.basename}${options.target}`;

  if (options.isDevenv)
  {
    buildSteps.push(
      tasks.addDevEnvVersion());
  }

  if (options.manifestVersion === 3)
  {
    buildSteps.push(
      tasks.mapping(config.rulesV3.mapping)
    );
  }

  if (options.target !== "local")
  {
    buildSteps.push(
      tasks.createManifest(options.manifest),
      translations(options.translations, options.manifest)
    );
  }

  buildSteps.push(
    tasks.mapping(options.mapping),
    tasks.webpack({
      webpackInfo: options.webpackInfo,
      addonName,
      addonVersion: options.version,
      sourceMapType: options.sourceMapType
    })
  );

  return buildSteps;
}

async function getBuildOptions(isDevenv, isSource)
{
  if (!isSource && !args.target)
    argumentParser.error("Argument \"-t/--target\" is required");

  const opts = {
    isDevenv,
    target: args.target,
    channel: args.channel,
    archiveType: args.target == "chrome" ? ".zip" : ".xpi",
    manifestVersion: args.manifest_version
  };

  opts.sourceMapType = opts.target == "chrome" ?
                        isDevenv == true ?
                        "inline-source-map" : false :
                        "source-map";
  if (args.config)
    configParser.setConfig(await import(url.pathToFileURL(args.config)));
  else
    configParser.setConfig(config);

  let configName;
  if (isSource)
    configName = "base";
  else
    configName = opts.target;

  opts.webpackInfo = configParser.getSection(configName, "webpack");
  opts.mapping = configParser.getSection(configName, "mapping");
  opts.basename = configParser.getSection(configName, "basename");
  opts.version = configParser.getSection(configName, "version");
  opts.translations = configParser.getSection(configName, "translations");

  if (isDevenv)
  {
    opts.output = gulp.dest(targetDir);
  }
  else
  {
    opts.baseversion = opts.version;
    if (opts.channel == "development")
    {
      const versionParts = opts.version.split(".", 4);
      if (versionParts.length > 3)
      {
        console.warn("Version string has more than three pre-defined segments");
      }

      for (let i = 0; i < 3; i++)
      {
        if (versionParts[i])
        {
          continue;
        }

        versionParts[i] = "0";
      }
      versionParts[3] = args["build_num"] || await gitUtils.getBuildnum();

      opts.version = versionParts.join(".");
    }
  }

  opts.manifest = await tasks.getManifestContent({
    target: opts.target,
    version: opts.version,
    channel: opts.channel,
    manifestPath: args.manifest_path,
    manifestVersion: opts.manifestVersion
  });

  return opts;
}

async function getBuildOutput(opts)
{
  if (opts.isDevenv)
  {
    return gulp.dest(targetDir);
  }

  const filenameTarget = (opts.channel === "release") ?
    opts.target :
    `${opts.target}${opts.channel}`;
  const filenameVersion = await getFilenameVersion(opts);

  const filenameParts = [
    opts.basename,
    filenameTarget,
    filenameVersion,
    `mv${opts.manifestVersion}`
  ];
  const filename = `${filenameParts.join("-")}${opts.archiveType}`;

  return zip.dest(`./dist/release/${filename}`);
}

async function getFilenameVersion(opts)
{
  const hasReleaseTag = await gitUtils.hasTag(
    `${opts.basename}-${opts.baseversion}`
  );
  if (hasReleaseTag)
  {
    return opts.version;
  }

  return gitUtils.getCommitHash();
}

async function buildDevenv()
{
  const options = await getBuildOptions(true);
  const output = await getBuildOutput(options);

  return merge(await getBuildSteps(options))
    .pipe(output);
}

async function buildPacked()
{
  const options = await getBuildOptions(false);
  const output = await getBuildOutput(options);

  return merge(await getBuildSteps(options))
    .pipe(output);
}

function cleanDir()
{
  return del(targetDir);
}

export const devenv = gulp.series(...devenvTasks);

export const build = gulp.series(...buildTasks);

export async function source()
{
  const options = await getBuildOptions(false, true);
  const filenameVersion = await getFilenameVersion(options);

  return tasks.sourceDistribution(
    `./dist/release/${options.basename}-${filenameVersion}`
  );
}
