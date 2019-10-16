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

const {restApiUrl} = require("./config");
const fetch = require("node-fetch");

// Authentication
const {CLIENT, PASSWORD, USER_ID} = process.env;

const getToken = () =>
{
  const uri = `${restApiUrl}/auth/token`;
  const authenticationData = {
    client: CLIENT,
    password: PASSWORD,
    userId: parseInt(USER_ID, 10)
  };

  const getTokenOptions = {
    method: "post",
    body: JSON.stringify(authenticationData),
    headers: {
      "Content-Type": "application/json"
    }
  };

  return fetch(uri, getTokenOptions).then((res) =>
  {
    if (!res.ok)
      return Promise.reject(res.json());
    return res.json();
  }).catch(console.error);
};

module.exports = {getToken, restApiUrl};
