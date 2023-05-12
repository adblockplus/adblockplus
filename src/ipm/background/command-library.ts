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
  CommandName,
  Command,
  commandLibraryVersion
} from "./command-library.types";
import { logError } from "./logger";
import { Prefs } from "../../../adblockpluschrome/lib/prefs";

/**
 * A list of known commands.
 */
const knownCommandsList = Object.values(CommandName);

/**
 * The key for the command storage.
 */
const commandStorageKey = "ipm_commands";

/**
 * Checks whether the given input satisfies the requirements to be treated
 * as a command from the IPM server, and to be precessed further.
 *
 * @param candidate The input to check
 * @returns True if the command is a valid IPM command, false if not
 */
function isCommand(candidate: unknown): candidate is Command {
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    "version" in candidate &&
    "ipm_id" in candidate &&
    "command_name" in candidate
  );
}

/**
 * Checks if the command can be processed.
 *
 * @param command The command from the IPM server
 * @returns Whether the command can be processed
 */
function canProcessCommand(command: Command): boolean {
  return (
    command.version === commandLibraryVersion &&
    knownCommandsList.includes(command.command_name)
  );
}

/**
 * Checks whether the command with the given id has already been processed
 * at an earlier time.
 *
 * @param ipmId The IPM id
 * @returns Whether the command with the given id has already been processed
 */
function hasProcessedCommand(ipmId: string): boolean {
  const commandStorage = Prefs.get(commandStorageKey);
  return ipmId in commandStorage;
}

/**
 * Stores the command data to persistent storage.
 *
 * @param command The command from the IPM server
 */
function storeCommandData(command: Command): void {
  const commandStorage = Prefs.get(commandStorageKey);
  commandStorage[command.ipm_id] = command;
  updatePrefs(commandStorageKey, commandStorage);
}

/**
 * Updates Prefs storage for given key. Will clone the value to store, so
 * that if `value` is an object, it will bypass the the Prefs storage's
 * change detection mechanism (which only catches changes on primitives).
 *
 * @param key The key to update the storage for
 * @param value The data to store
 */
function updatePrefs(key: string, value: any): void {
  const clone = JSON.parse(JSON.stringify(value));
  Prefs.set(key, clone);
}

/**
 * Executes a command sent by the IPM server.
 *
 * @param command The command from the IPM server
 */
export function executeIPMCommand(command: unknown): void {
  if (!isCommand(command)) {
    logError("[CommandLibrary]: Invalid command received.");
    return;
  }

  if (!canProcessCommand(command)) {
    logError(
      "[CommandLibrary]: Unknown command name received:",
      command.command_name
    );
    return;
  }

  if (hasProcessedCommand(command.ipm_id)) {
    logError("[CommandLibrary]: Campaign already processed:", command.ipm_id);
    return;
  }

  storeCommandData(command);

  switch (command.command_name) {
    case CommandName.createOnPageDialog:
      // call middleware
      break;
    default:
      // We should never get here
      logError(
        "[CommandLibrary]: Invalid command name received:",
        command.command_name
      );
  }
}
