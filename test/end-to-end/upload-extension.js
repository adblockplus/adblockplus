/* eslint-disable quote-props */
/* eslint-disable max-len */
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

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const username = process.argv[2];
const password = process.argv[3];
const filePath = process.argv[4];

if (!username || !password || !filePath)
{
  console.error("Error: Username, password, or file path is missing. " +
    "Please provide all three as arguments.");
  process.exit(1);
}

const axiosConfig = {
  auth: {
    username,
    password
  }
};

const formData = new FormData();
formData.append("extensions", fs.createReadStream(filePath));

const axiosPostConfig = {
  method: "post",
  url: "https://api.lambdatest.com/automation/api/v1/files/extensions",
  data: formData,
  headers: {
    ...formData.getHeaders()
  },
  ...axiosConfig
};

axios(axiosPostConfig)
  .then(response =>
  {
    const responseData = response.data;
    if (responseData.status === "success" && responseData.data.length > 0)
    {
      const s3Url = responseData.data[0].s3_url;
      // eslint-disable-next-line no-console
      console.log(s3Url);
      return s3Url;
    }
    console.error("Error uploading file:", responseData.message);
    return null;
  })
  .catch(error =>
  {
    console.error("Error uploading file:",
      error.response ? error.response.data : error.message);
    return null;
  });
