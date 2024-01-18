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
  type Behavior,
  type Command,
  type CommandActor,
  CommandName,
  CommandVersion,
  type Content
} from "./command-library.types";
import * as logger from "../../logger/background";
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
 * Map of known command actors
 */
const actorByCommandName = new Map<CommandName, CommandActor>();

/**
 * List of commands that cannot be executed yet, including indication
 * whether they are meant to be reinitialized
 */
const unexecutableCommands = new Map<Command, boolean>();

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
 * Sets actor for handling command with given name
 *
 * @param commandName - Command name
 * @param actor - Command actor
 */
export function setCommandActor(
  commandName: CommandName,
  actor: CommandActor
): void {
  actorByCommandName.set(commandName, actor);
  retryExecuteCommands(commandName);
}

/**
 * Checks if the command can be processed.
 *
 * @param command The command from the IPM server
 * @returns Whether the command can be processed
 */
function canProcessCommand(command: Command): boolean {
  return (
    knownCommandsList.includes(command.command_name) &&
    command.version === CommandVersion[command.command_name]
  );
}

/**
 * Removes the command data from persistent storage
 *
 * @param ipmId - IPM ID
 */
export function dismissCommand(ipmId: string): void {
  const command = getCommand(ipmId);
  if (!command) {
    return;
  }

  const commandStorage = Prefs.get(commandStorageKey);
  // We can't use a Map or Set for `commandStorage`, so we need dynamic
  // deletion here.
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete commandStorage[command.ipm_id];
  void Prefs.set(commandStorageKey, commandStorage);
}

/**
 * Retrieves command behavior for given IPM ID
 *
 * @param ipmId - IPM ID
 *
 * @returns command behavior
 */
export function getBehavior(ipmId: string): Behavior | null {
  const command = getCommand(ipmId);
  if (!command) {
    return null;
  }

  const actor = actorByCommandName.get(command.command_name);
  if (!actor) {
    return null;
  }

  return actor.getBehavior(command);
}

/**
 * Retrieves command for given IPM ID
 *
 * @param ipmId - IPM ID
 *
 * @returns command
 */
function getCommand(ipmId: string): Command | null {
  const commandStorage = Prefs.get(commandStorageKey);
  return commandStorage[ipmId] || null;
}

/**
 * Retrieves command content for given IPM ID
 *
 * @param ipmId - IPM ID
 *
 * @returns command content
 */
export function getContent(ipmId: string): Content | null {
  const command = getCommand(ipmId);
  if (!command) {
    return null;
  }

  const actor = actorByCommandName.get(command.command_name);
  if (!actor) {
    return null;
  }

  return actor.getContent(command);
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
 * Retries executing commands that couldn't be executed
 *
 * @param commandName - Command name
 */
function retryExecuteCommands(commandName: CommandName): void {
  for (const [command, isInitialization] of unexecutableCommands) {
    if (command.command_name !== commandName) {
      continue;
    }

    unexecutableCommands.delete(command);
    executeIPMCommand(command, isInitialization);
  }
}

/**
 * Stores the command data to persistent storage.
 *
 * @param command The command from the IPM server
 */
function storeCommand(command: Command): void {
  const storage = Prefs.get(commandStorageKey);
  storage[command.ipm_id] = command;
  void Prefs.set(commandStorageKey, storage);
}

/**
 * Executes a command sent by the IPM server.
 *
 * @param command The command from the IPM server
 * @param isInitialization Whether the command is being restored when the
 *   module initializes
 */
export function executeIPMCommand(
  command: unknown,
  isInitialization: boolean = false
): void {
  if (!isCommand(command)) {
    logger.error("[ipm]: Invalid command received.");
    return;
  }

  if (!canProcessCommand(command)) {
    logger.error("[ipm]: Unknown command name received:", command.command_name);
    return;
  }

  const actor = actorByCommandName.get(command.command_name);
  if (!actor) {
    logger.debug("[ipm]: No actor found:", command.command_name);
    unexecutableCommands.set(command, isInitialization);
    return;
  }

  if (!actor.isValidCommand(command)) {
    logger.error("[ipm]: Invalid parameters received.");
    return;
  }

  if (!isInitialization) {
    if (hasProcessedCommand(command.ipm_id)) {
      logger.error("[ipm]: Campaign already processed:", command.ipm_id);
      return;
    }

    storeCommand(command);
  }

  void actor.handleCommand(command.ipm_id);
}

/**
 * Initializes command library
 */
async function start(): Promise<void> {
  await Prefs.untilLoaded;

  // Reinitialize commands from storage
  const commandStorage = Prefs.get(commandStorageKey);
  for (const command of Object.values(commandStorage)) {
    executeIPMCommand(command, true);
  }
}

void start().catch(logger.error);
