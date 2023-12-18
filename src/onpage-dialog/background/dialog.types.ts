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

import { type LicenseStateBehavior } from "../../ipm/background";
import { type DialogContent } from "../shared";
import { type Timing } from "./timing.types";

/**
 * On-page dialog behavior
 */
export interface DialogBehavior extends LicenseStateBehavior {
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
  /**
   * List of domains on which the dialog should or should not be shown
   */
  domainList?: string;
}

/**
 * Dialog information
 */
export interface Dialog {
  /**
   * Dialog behavior
   */
  behavior: DialogBehavior;
  /**
   * Dialog content
   */
  content: DialogContent;
  /**
   * Dialog ID
   */
  id: string;
  /**
   * IPM ID, if applicable
   */
  ipmId?: string;
}
