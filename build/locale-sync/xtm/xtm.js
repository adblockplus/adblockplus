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

const admZip = require("adm-zip");
const FormData = require("form-data");
const {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  unlinkSync
} = require("fs");
const fetch = require("node-fetch");
const path = require("path");

const {getToken, restApiUrl} = require("./authentication");
const {sourceLanguage, targetLanguages, xtmToLocalesMap} = require("./config");

/**
 * Creates Authorization header using Token
 * https://wstest2.xtm-intl.com/rest-api/#operation/generateTokenUsingPOST
 * @param {String} token Authorization token of API
 * @returns {Object}
 */
function generateAuthHeader(token)
{
  return {Authorization: `XTM-Basic ${token}`};
}

function errorHandler(errorMsg)
{
  console.error(errorMsg);
  process.exit(1);
}

/**
 * Adds translation files into formData
 * @param {Array} files array of file paths
 * @param {String} property "files" or "translationFiles" depending on API
 * @param {Object} form formData to append data to
 * @returns {Object} formData
 */
function prepareTranslationFiles(files, property, form)
{
  files.forEach((file, index) =>
  {
    const fileKey = `${property}[${index}].file`;
    form.append(fileKey, createReadStream(file));
  });
  return form;
}

/**
 * Creates formData from JSON Object
 * @param {Object} data formData representing JSON Object
 * @returns {Object} formData
 */
function createFormData(data)
{
  const form = new FormData();
  for (const key in data)
  {
    const item = data[key];
    if (Array.isArray(item))
      form.append(key, item.join(", "));
    else
      form.append(key, item);
  }
  return form;
}

/*
 * Handles fetch response
 */
function fetchResponse(res)
{
  if (!res.ok)
  {
    return res.json().then((error) => Promise.reject(error),
                           (error) => Promise.reject(error));
  }
  return res.json();
}

/**
 * Creates project with source file
 * see -> https://wstest2.xtm-intl.com/rest-api/#operation/createProjectUsingPOST
 * @param {String} name Name of the project
 * @param {Object} options Additional options ex.: workflowId, customerId
 * @param {Array} files Array of file paths
 * @returns {Promise}
 */
function createProject(name, options, files)
{
  return getToken().then(({token}) =>
  {
    const uri = `${restApiUrl}/projects`;
    const data = {
      name, sourceLanguage, targetLanguages
    };
    Object.assign(data, options);
    const form = prepareTranslationFiles(files, "translationFiles",
                                         createFormData(data));

    const dataCreateProject = {
      method: "POST",
      body: form,
      headers: generateAuthHeader(token)
    };

    return fetch(uri, dataCreateProject);
  }).then(fetchResponse).then(({projectId}) =>
  {
    return `project: ${projectId} is created`;
  });
}

/**
 * https://wstest2.xtm-intl.com/rest-api/#operation/getProjectsUsingGET
 * @param {String} projectName name of the project
 * @returns {Number}
 */
function getProjectIdByName(projectName)
{
  return getToken().then(({token}) =>
  {
    const data = {
      method: "GET",
      headers: generateAuthHeader(token)
    };
    return fetch(`${restApiUrl}/projects`, data);
  }).then(fetchResponse).then((projects) =>
  {
    const project = projects.filter(({name}) => name == projectName)[0];
    return project ? project.id : null;
  }).catch(console.error);
}

/**
 * https://www.xtm-cloud.com/rest-api/#operation/updateProjectUsingPUT
 * @param {number} projectId project ID
 * @param {json} details Data to update (ex.: subjectMatterId, projectManagerId)
 * @returns {Promise}
 */
function updateDetails(projectId, details)
{
  return getToken().then(({token}) =>
  {
    const uri = `${restApiUrl}/projects/${projectId}`;
    const headers = generateAuthHeader(token);
    headers["Content-Type"] = "application/json";
    const dataupdateDetails = {
      method: "PUT",
      headers,
      body: JSON.stringify(details)
    };
    return fetch(uri, dataupdateDetails);
  }).then(fetchResponse).then(() =>
  {
    const detailNames = Object.keys(details).join(", ");
    return `${detailNames} are updated for project ${projectId}`;
  });
}

/**
 * Update project source files
 * see -> https://wstest2.xtm-intl.com/rest-api/#operation/uploadFilesUsingPOST
 * @param {number} projectId project ID
 * @param {array} files Array of file paths
 * @returns {Promise}
 */
function updateProject(projectId, files)
{
  return getToken().then(({token}) =>
  {
    const uri = `${restApiUrl}/projects/${projectId}/files/upload`;
    const data = {matchType: "MATCH_NAMES"};
    const form = prepareTranslationFiles(files, "files",
                                         createFormData(data));
    const dataUpdateProject = {
      method: "POST",
      body: form,
      headers: generateAuthHeader(token)
    };
    return fetch(uri, dataUpdateProject);
  }).then(fetchResponse).then(() =>
  {
    return `project: ${projectId} is updated`;
  });
}

/**
 * Generate project target files
 * see -> https://wstest2.xtm-intl.com/rest-api/#operation/generateFilesUsingPOST
 * @param {number} projectId project ID
 * @returns {Promise}
 */
function buildProject(projectId)
{
  return getToken().then(({token}) =>
  {
    const query = "fileType=TARGET";
    const uri = `${restApiUrl}/projects/${projectId}/files/generate?${query}`;
    const data = {
      method: "POST",
      headers: generateAuthHeader(token)
    };

    return fetch(uri, data);
  }).then(fetchResponse).then(() =>
  {
    return `${projectId} has been built`;
  });
}

/**
 * Download the project target files
 * https://wstest2.xtm-intl.com/rest-api/#operation/downloadFilesUsingGET
 * @param {Number} projectId Project ID
 * @param {String} destination destination for XTM project download
 * @param {Function} callback Called after the project is downloded
 * @returns {Promise}
 */
function downloadProject(projectId, destination, callback)
{
  if (!existsSync(destination))
    mkdirSync(destination);

  const zipFile = path.join(destination, "xtm.zip");
  return getToken().then(({token}) =>
  {
    const query = "fileType=TARGET";
    const uri = `${restApiUrl}/projects/${projectId}/files/download?${query}`;
    const data = {
      method: "GET",
      headers: generateAuthHeader(token)
    };
    return fetch(uri, data).then((res) =>
    {
      return new Promise((resole, reject) =>
      {
        res.body.pipe(createWriteStream(zipFile)).on("close", () =>
        {
          console.log("Zip file is Downloaded");
          const zip = new admZip(zipFile);
          const zipEntries = zip.getEntries();
          const dataTreeObj = {};
          for (const zipEntry of zipEntries)
          {
            const xtmFilePath = zipEntry.entryName;
            const xtmFilename = path.parse(xtmFilePath).base;
            const xtmLocale = path.dirname(xtmFilePath);
            const locale = xtmToLocalesMap[xtmLocale];
            if (!(xtmFilename in dataTreeObj))
              dataTreeObj[xtmFilename] = {};

            dataTreeObj[xtmFilename][locale] = JSON.parse(zipEntry.getData());
          }
          unlinkSync(zipFile);
          resole(dataTreeObj);
        }).on("error", reject);
      });
    });
  }).catch(errorHandler);
}

module.exports = {createProject, updateProject, downloadProject, buildProject,
  getProjectIdByName, updateDetails};
