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

import { commandStorageKey, setCommandActor } from "./command-library";
import {
  type Command,
  type CommandHandler,
  CommandName,
  type Content
} from "./command-library.types";
import {
  deleteAllKey,
  type DeleteBehavior,
  type DeleteCommand,
  type DeleteParams
} from "./delete-commands.types";
import * as logger from "../../logger/background";
import { validateParams } from "./param-validator";
import type { ParamDefinitionList } from "./param-validator.types";
import { Prefs } from "../../../adblockpluschrome/lib/prefs";

/**
 * List of delete-commands parameter definitions
 */
const paramDefinitionList: ParamDefinitionList<DeleteParams> = [
  {
    name: "commands",
    validate: (param): boolean =>
      typeof param === "string" && param.trim() !== ""
  }
];

/**
 * Runs parameter validation on the given command to check whether it can be
 * worked with. Will log validation errors.
 *
 * @param command The command to check
 * @returns Whether the command is a valid DeleteCommand and can be worked with
 */
function isDeleteCommand(command: Command): command is DeleteCommand {
  const validationErrors = validateParams(command, paramDefinitionList);
  if (validationErrors.length === 0) {
    return true;
  }

  logger.error(
    "[delete-commands]: Invalid parameteres received:",
    validationErrors.join(" ")
  );
  return false;
}

/**
 * Checks whether given candidate is delete-commands behavior
 *
 * @param candidate - Candidate
 * @returns whether given candidate is delete-commands behavior
 */
export function isDeleteBehavior(
  candidate: unknown
): candidate is DeleteBehavior {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "commandIds" in candidate
  );
}

/**
 * Extracts delete-commands behavior from the given command.
 *
 * @param command - The command to extract the behavior from
 * @returns The behavior of the command, or `null` if the given command is
 *          not a valid NewTabCommand
 */
function getBehavior(command: Command): DeleteBehavior | null {
  if (!isDeleteCommand(command)) {
    return null;
  }

  const commands = command.commands.trim();
  let commandIds;

  if (commands === deleteAllKey) {
    commandIds = Object.keys(Prefs.get(commandStorageKey));
  } else {
    commandIds = commands.split(",").map((id) => id.trim());
  }

  return { commandIds };
}

/**
 * Extracts delete-commands content from the given command.
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
 * Sets delete-commands IPM command handler
 *
 * @param handler - Command handler
 */
export function setDeleteCommandHandler(handler: CommandHandler): void {
  setCommandActor(CommandName.deleteCommands, {
    getBehavior,
    getContent,
    handleCommand: handler,
    isValidCommand: isDeleteCommand
  });
}
