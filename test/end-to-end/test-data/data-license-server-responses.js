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

const serverResponsesData = [
  {
    testName: "response 302",
    request: `
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "premium.activate", userId: "server_error_302" }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `,
    premiumStatus: "enabled",
    errorId: /Received unexpected response.*(code: 302)/
  },
  {
    testName: "response 418",
    request: `
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "premium.activate", userId: "server_error_418" }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `,
    premiumStatus: "enabled",
    errorId: /Premium license check failed.*Error: Request failed \(code: 418\)/
  },
  {
    testName: "response 500",
    request: `
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "premium.activate", userId: "server_error_500" }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `,
    premiumStatus: "enabled",
    errorId: /Premium license check failed \(retries: 0\).*Error: Received error response \(code: 500\)/
  },
  {
    testName: "non-json",
    request: `
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "premium.activate", userId: "non_json_response" }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `,
    premiumStatus: "enabled",
    errorId: /Premium license check failed.*SyntaxError: Unexpected token 'o',.*"non_json_response.*" is not valid JSON/
  },
  {
    testName: "wrong status",
    request: `
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "premium.activate", userId: "wrong_license_status" }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `,
    premiumStatus: "disabled",
    errorId: /Invalid Premium license.*Error: Unknown license status: wrong_status/
  },
  {
    testName: "wrong version",
    request: `
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "premium.activate", userId: "wrong_license_version" }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `,
    premiumStatus: "disabled",
    errorId: /Invalid Premium license.*Error: Invalid license version: 2/
  },
  {
    testName: "invalid user id",
    request: `
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "premium.activate", userId: "invalid_user_id" }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `,
    premiumStatus: "enabled",
    errorId: /Premium license check failed.*Error: Request failed \(code: 401\)/
  },
  {
    testName: "expired license",
    request: `
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "premium.activate", userId: "expired_user_id" }, response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    `,
    premiumStatus: "disabled",
    errorId: /Invalid Premium license.*Error: Expired license/
  }
];

exports.serverResponsesData = serverResponsesData;
