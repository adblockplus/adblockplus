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

/* eslint-disable no-console */

const {execSync} = require("child_process");
const {writeFileSync, existsSync, mkdirSync} = require("fs");
const minimist = require("minimist");
const path = require("path");

const {getSourceStringFileDiffs} = require("../common/diff");
const {importFilesObjects} = require("../common/import");
const {localesDir, sourceLanguage, customerId,
  workflowId, analysisTemplateId, projectManagerId,
  subjectMatterId} = require("./config");
const xtm = require("./xtm");

const argv = minimist(process.argv.slice(2));

function exec(command)
{
  return execSync(command, {encoding: "utf8"}).trim();
}

function errorHandler(errorMsg)
{
  console.error(errorMsg);
  process.exit(1);
}

function getProjectName()
{
  if (argv.project)
    return argv.project;
  return exec("git rev-parse --abbrev-ref HEAD");
}

function getParentVersionHash()
{
  if (argv.rev)
    return argv.rev;
  return exec("git rev-parse master");
}

function createSourceFiles(hash)
{
  const files = [];
  const tempFolder = process.pid.toString();
  return getSourceStringFileDiffs(hash).then((changes) =>
  {
    for (const {added, modified, fileName, locale} of changes)
    {
      const dir = path.join(tempFolder, locale);
      const file = path.join(dir, fileName);
      const data = JSON.stringify(Object.assign(added, modified), null, 2);
      if (!existsSync(tempFolder))
        mkdirSync(tempFolder);
      if (!existsSync(dir))
        mkdirSync(dir);
      writeFileSync(file, data);
      files.push(file);
    }
    return files;
  });
}

/**
 * Creates a new XTM project with the name of current branchname
 * @returns {Promise}
 */
function create()
{
  const hash = getParentVersionHash();
  const branchName = getProjectName();
  return xtm.getProjectIdByName(branchName).then((projectId) =>
  {
    if (projectId)
      throw `Project ${branchName} already exists`;
    return createSourceFiles(hash);
  }).then((files) =>
  {
    const parameters = {customerId, workflowId, analysisTemplateId};
    return xtm.createProject(branchName, parameters, files);
  });
}

/**
 * Updates existing XTM project using branchname
 * @returns {Promise}
 */
function update()
{
  const branchName = getProjectName();
  return xtm.getProjectIdByName(branchName).then((projectId) =>
  {
    if (!projectId)
      throw `No project ${branchName} found`;

    const hash = getParentVersionHash();
    return createSourceFiles(hash).then((files) =>
    {
      return xtm.updateProject(projectId, files);
    });
  });
}

/**
 * Updated details of the project which are not possible to set during create()
 * @returns {Promise}
 */
function updateDetails()
{
  const branchName = getProjectName();
  return xtm.getProjectIdByName(branchName).then((projectId) =>
  {
    if (!projectId)
      throw `No project ${branchName} found`;
    const data = {
      projectManagerId, subjectMatterId
    };
    return xtm.updateDetails(projectId, data);
  });
}

/**
 * Downloads project that matches current branchname
 * @returns {Promise}
 */
function downloadProject()
{
  const destination = process.pid.toString();
  const branchName = getProjectName();
  return xtm.getProjectIdByName(branchName).then((projectId) =>
  {
    return xtm.downloadProject(projectId, destination);
  }).then((filesObject) =>
  {
    return importFilesObjects(filesObject, localesDir, sourceLanguage);
  });
}

/**
 * Generate translation files - prepare them for being downloaded
 * @returns {Promise}
 */
function buildProject()
{
  const destination = process.pid.toString();
  const branchName = getProjectName();
  return xtm.getProjectIdByName(branchName).then((projectId) =>
  {
    return xtm.buildProject(projectId, destination);
  }).then(console.log);
}

process.on("exit", () =>
{
  const tempFolder = process.pid.toString();
  exec(`rm -rf ${tempFolder}`);
});

if (argv.create)
{
  create()
    .then(console.log)
    .then(updateDetails)
    .then(console.log)
    .catch(errorHandler);
}
else if (argv.update)
{
  update().then(console.log).catch(errorHandler);
}
else if (argv.details)
{
  updateDetails().then(console.log).catch(errorHandler);
}
else if (argv.download)
{
  downloadProject();
}
else if (argv.build)
{
  buildProject().catch(errorHandler);
}
else
{
  errorHandler("Missing argument");
}
