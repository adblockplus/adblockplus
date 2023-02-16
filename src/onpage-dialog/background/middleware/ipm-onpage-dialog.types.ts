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

import { Behavior, Command, Content } from "../../../ipm/background";

/**
 * Timing name
 */
export enum Timing {
  afterWebAllowlisting = "after_web_allowlisting",
  revisitWebAllowlisted = "revisit_web_allowlisted_site"
}

/**
 * On-page dialog behavior
 */
export interface DialogBehavior extends Behavior {
  /**
   * On-page dialog display duration in minutes
   */
  displayDuration: number;
  /**
   * Target page to open when interacting with the on-page dialog
   */
  target: string;
  /**
   * When to open on-page dialog
   */
  timing: Timing;
}

/**
 * On-page dialog command parameters
 */
export interface DialogParams {
  timing: Timing;
  display_duration?: number;
  sub_title: string;
  upper_body: string;
  lower_body?: string;
  button_label: string;
  button_target: string;
}

/**
 * A valid IPM command for an on page dialog command.
 */
export type DialogCommand = Command & DialogParams;

/**
 * On-page dialog content
 */
export interface DialogContent extends Content {
  /**
   * Paragraph text for body
   */
  body: string[];
  /**
   * Button text
   */
  button: string;
  /**
   * Title text
   */
  title: string;
}

/**
 * On-page dialog event names
 */
export enum DialogEventType {
  buttonClicked = "dialog_button_clicked",
  closed = "dialog_closed",
  ignored = "dialog_ignored",
  injected = "dialog_injected"
}
