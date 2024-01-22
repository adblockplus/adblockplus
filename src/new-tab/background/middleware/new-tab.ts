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

import {
  type Command,
  type CommandHandler,
  CommandName,
  defaultLicenseState,
  type ParamDefinitionList,
  isSafeUrl,
  isValidLicenseStateList,
  setCommandActor,
  validateParams,
  type Content
} from "../../../ipm/background";
import * as logger from "../../../logger/background";
import {
  CreationMethod,
  defaultCreationMethod,
  type NewTabBehavior,
  type NewTabCommand,
  type NewTabParams
} from "./new-tab.types";

/**
 * List of new tab parameter definitions
 */
const paramDefinitionList: ParamDefinitionList<NewTabParams> = [
  {
    name: "url",
    validate: isSafeUrl
  },
  {
    name: "license_state_list",
    validate: isValidLicenseStateList
  },
  {
    name: "method",
    validate: (param): boolean =>
      typeof param === "undefined" ||
      (typeof param === "string" &&
        Object.values(CreationMethod)
          .map((method) => String(method))
          .includes(param))
  }
];

/**
 * Runs parameter validation on the given command to check whether it can be
 * worked with. Will log validation errors.
 *
 * @param command The command to check
 * @returns Whether the command is a valid NewTabCommand and can be worked with
 */
function isNewTabCommand(command: Command): command is NewTabCommand {
  const validationErrors = validateParams(command, paramDefinitionList);
  if (validationErrors.length === 0) {
    return true;
  }

  logger.error(
    "[new-tab]: Invalid parameters received:",
    validationErrors.join(" ")
  );
  return false;
}

/**
 * Checks whether given candidate is new tab behavior
 *
 * @param candidate - Candidate
 * @returns whether given candidate is new-tab behavior
 */
export function isNewTabBehavior(
  candidate: unknown
): candidate is NewTabBehavior {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "target" in candidate &&
    "method" in candidate
  );
}

/**
 * Extracts new tab behavior from the given command.
 *
 * @param command - The command to extract the behavior from
 * @returns The behavior of the command, or `null` if the given command is
 *  not a valid NewTabCommand
 */
function getBehavior(command: Command): NewTabBehavior | null {
  if (!isNewTabCommand(command)) {
    return null;
  }

  const method =
    typeof command.method === "undefined"
      ? defaultCreationMethod
      : CreationMethod[command.method];

  return {
    target: command.url,
    licenseStateList: command.license_state_list ?? defaultLicenseState,
    method
  };
}

/**
 * Extracts new tab content from the given command.
 *
 * Currently there is no content in the IPM Command, so this will always
 * return an empty `Content` object.
 *
 * @param command - The command to extract the content from
 * @returns The content (always an empty object)
 */
function getContent(): Content {
  return {};
}

/**
 * Sets new tab command handler
 *
 * @param handler - Command handler
 */
export function setNewTabCommandHandler(handler: CommandHandler): void {
  setCommandActor(CommandName.createTab, {
    getBehavior,
    getContent,
    handleCommand: handler,
    isValidCommand: isNewTabCommand
  });
}
