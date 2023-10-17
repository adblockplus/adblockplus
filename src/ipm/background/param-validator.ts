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

import { isDomainList } from "../../core/url/shared";
import { Command } from "./command-library.types";
import { ParamDefinitionList, ParamValidator } from "./param-validator.types";
import { createSafeOriginUrl } from "./url";

/**
 * Checks whether the given parameter is of type number, and not NaN.
 *
 * @param param The parameter to validate
 * @returns Whether the parameter is numeric
 */
export const isNumeric: ParamValidator = (param) =>
  typeof param === "number" && !Number.isNaN(param);

/**
 * Checks whether the given parameter is of type string and not empty.
 *
 * @param param The parameter to check
 * @returns Whether the param is a string that's not empty
 */
export const isNotEmpty: ParamValidator = (param) =>
  typeof param === "string" && param.length > 0;

/**
 * Checks whether the given parameter is a safe URL string.
 *
 * @param param The parameter to check
 * @returns whether the given parameter is a safe URL string
 */
export const isSafeUrl: ParamValidator = (param: unknown): boolean => {
  if (typeof param !== "string") {
    return false;
  }

  // We consider the URL safe if we can successfully create a URL
  // with a safe origin from it.
  const url = createSafeOriginUrl(param);
  return typeof url === "string";
};

/**
 * Validates a list of domains
 *
 * @param param The parameter to check
 * @returns whether the given parameter is a valid domain list
 */
export const isValidDomainList: ParamValidator = (param: unknown): boolean => {
  if (!param) {
    return true;
  }

  if (typeof param !== "string") {
    return false;
  }

  return isDomainList(param);
};

/**
 * Validates the given command to check if the requirements for the
 * parameters are met. Will return an array containing one error message for
 * every invalid parameter, so that the length of the array is the number of
 * parameter validation errors.
 *
 * @param command The command to validate
 * @param paramDefinitions The definition for the expected params
 * @returns An array containing one error message for every invalid parameter
 */
export function validateParams<T>(
  command: Command,
  paramDefinitions: ParamDefinitionList<T>
): string[] {
  return paramDefinitions
    .map((definition) => {
      // Typescript is considering `definition.name` to be of type
      // Symbol (keyof T), so we need to convert it into a string
      const name = String(definition.name);
      const param = command[name];
      return definition.validate(param)
        ? ""
        : `Invalid value for parameter "${name}", got "${param}":`;
    })
    .filter((result) => result !== "");
}
