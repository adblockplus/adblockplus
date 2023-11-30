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

import { CommandName } from "./command-library.types";

/**
 * The types of data sent to the IPM server
 */
export enum DataType {
  /**
   * The customer data type.
   */
  customer = "customer",
  /**
   * The device data type.
   */
  device = "device",
  /**
   * The event data type.
   */
  event = "event"
}

/**
 * The base attributes that are being sent to the IPM server
 */
export interface BaseAttributes {
  /**
   * The name of the extension.
   */
  app_name: string;
  /**
   * The name of the browser.
   */
  browser_name: string;
  /**
   * The operating system that the browser runs on.
   */
  os: string;
  /**
   * The UI language of the browser.
   */
  language_tag: string;
  /**
   * The version of the extension
   */
  app_version: string;
  /**
   * The version of the Command Library that this extension is running.
   */
  command_library_version: number;
  /**
   * String describing how the add-on was installed.
   */
  install_type: string;
}

/**
 * The event object attributes that are being sent to the IPM server
 */
interface EventAttributes extends BaseAttributes {
  /**
   *  The IPM id of the Dialog Command that triggered this event.
   */
  ipm_id: string;
  /**
   * The name of the command to which the event is associated.
   */
  command_name: CommandName;
  /**
   * The version of the command to which the event is associated.
   */
  command_version: number;
}

/**
 * An enum containing all known types of Platforms.
 */
export enum PlatformType {
  web = "web"
}

/**
 * The user event object(s) that are being sent to the IPM server
 */
export interface EventData {
  /**
   * The type of data we send (required by MoEngage).
   */
  type: DataType.event;
  /**
   * A token uniquely identifying an extension installation.
   */
  device_id: string;
  /**
   * The name of the event to be tracked.
   */
  action: string;
  /**
   * Used to identify the platform on which the event happened.
   */
  platform: PlatformType;
  /**
   * The version of the extension
   */
  app_version: string;
  /**
   * Local Time at which the event happened.
   */
  user_time: string;

  attributes: EventAttributes;
}

/**
 * An enum containing all known states for License.
 */
export enum LicenseState {
  active = "premium",
  inactive = "free"
}

/**
 * The event object attributes that are being sent to the IPM server
 */
interface DeviceAttributes extends BaseAttributes {
  /**
   * The total number of requests blocked by the extension.
   */
  blocked_total: number;
  /**
   * Whether the user has an active premium license.
   */
  license_status: LicenseState;
}

/**
 * The device attributes that are being sent to the IPM server
 */
export interface DeviceData {
  /**
   * The type of data we send (required by MoEngage).
   */
  type: DataType.device;
  /**
   * A token uniquely identifying an extension installation.
   */
  device_id: string;

  attributes: DeviceAttributes;
}

/**
 * An enum containing all known Platform statuses.
 */
export enum PlatformStatus {
  true = "true"
}

/**
 * The platforms and their status
 */
interface PlatformInfo {
  platform: PlatformType;
  active: PlatformStatus;
}

/**
 * List of associated platforms and their status.
 */
type PlatformInfoList = PlatformInfo[];

/**
 * The device attributes that are being sent to the IPM server
 */
export interface UserData {
  /**
   * The type of data we send (required by MoEngage).
   */
  type: DataType.customer;
  /**
   * List associated platforms and their status.
   */
  platforms: PlatformInfoList;

  attributes: BaseAttributes;
}

/**
 * The payload that is being sent to the IPM server
 */
export interface PayloadData {
  user: UserData;

  device: DeviceData;

  events: EventData[];
}

/**
 * The key for the user event storage.
 */
export const eventStorageKey = "ipm_events";
