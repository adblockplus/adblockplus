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
  type ParamDefinitionList,
  defaultLicenseState,
  isNotEmpty,
  isSafeUrl,
  isValidDomainList,
  isValidLicenseStateList,
  setCommandActor,
  validateParams
} from "../../../ipm/background";
import * as logger from "../../../logger/background";
import { type DialogContent } from "../../shared";
import { type DialogBehavior } from "../dialog.types";
import { Timing } from "../timing.types";
import {
  type DialogCommand,
  type DialogParams
} from "./ipm-onpage-dialog.types";

/**
 * List of on-page dialog parameter definitions
 */
const paramDefinitionList: ParamDefinitionList<DialogParams> = [
  {
    name: "timing",
    validate: (param): boolean =>
      typeof param === "undefined" ||
      param === Timing.afterWebAllowlisting ||
      param === Timing.revisitWebAllowlisted ||
      param === Timing.afterNavigation
  },
  {
    name: "display_duration",
    validate: (param): boolean =>
      typeof param === "undefined" ||
      (typeof param === "number" && param >= 0 && param <= 20)
  },
  {
    name: "sub_title",
    validate: isNotEmpty
  },
  {
    name: "upper_body",
    validate: isNotEmpty
  },
  {
    name: "button_label",
    validate: isNotEmpty
  },
  {
    name: "button_target",
    validate: isSafeUrl
  },
  {
    name: "domain_list",
    validate: isValidDomainList
  },
  {
    name: "license_state_list",
    validate: isValidLicenseStateList
  }
];

/**
 * Extracts on-page dialog behavior from command
 *
 * @param command - Command
 *
 * @returns on-page dialog behavior
 */
function getBehavior(command: Command): DialogBehavior | null {
  if (!isDialogCommand(command)) {
    return null;
  }

  return {
    displayDuration:
      typeof command.display_duration === "number"
        ? command.display_duration
        : 5,
    target: command.button_target,
    timing: command.timing,
    domainList: command.domain_list,
    licenseStateList: command.license_state_list ?? defaultLicenseState
  };
}

/**
 * Extracts on-page dialog content from command
 *
 * @param command - Command
 *
 * @returns on-page dialog content
 */
function getContent(command: Command): DialogContent | null {
  if (!isDialogCommand(command)) {
    return null;
  }

  return {
    body:
      typeof command.lower_body === "string"
        ? [command.upper_body, command.lower_body]
        : [command.upper_body],
    button: command.button_label,
    title: command.sub_title
  };
}

/**
 * Runs parameter validation on the given command to check whether it can be
 * worked with. Will log validation errors.
 *
 * @param command The command to check
 * @returns Whether the command is a valid DialogCommand and can be worked with
 */
function isDialogCommand(command: Command): command is DialogCommand {
  const validationErrors = validateParams(command, paramDefinitionList);

  if (validationErrors.length === 0) {
    return true;
  }

  logger.error(
    "[onpage-dialog]: Invalid parameters received:",
    validationErrors.join(" ")
  );
  return false;
}

/**
 * Sets on-page dialog command handler
 *
 * @param handler - Command handler
 */
export function setDialogCommandHandler(handler: CommandHandler): void {
  setCommandActor(CommandName.createOnPageDialog, {
    getBehavior,
    getContent,
    handleCommand: handler,
    isValidCommand: isDialogCommand
  });
}
