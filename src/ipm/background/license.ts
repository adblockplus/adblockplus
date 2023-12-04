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

import { getPremiumState } from "../../premium/background";
import { type LicenseStateBehavior } from "./command-library.types";
import { LicenseState } from "./data-collection.types";

/**
 * The default license state for the license_state_list command parameter.
 */
export const defaultLicenseState = LicenseState.inactive;

/**
 * Checks whether the given parameter is of type LicenseState.
 *
 * @param candidate - the input to check
 * @returns whether the parameter is a LicenseState
 */
export function isValidLicenseState(
  candidate: unknown
): candidate is LicenseState {
  return (
    typeof candidate === "string" &&
    Object.values(LicenseState).includes(candidate as LicenseState)
  );
}

/**
 * Checks whether the current Premium license state match the license state on
 * the command.
 *
 * @param behavior - the behavior of the command
 * @returns the current Premium license state matches the license state on the
 *   command
 */
export async function doesLicenseStateMatch(
  behavior: LicenseStateBehavior
): Promise<boolean> {
  if (!behavior.licenseStateList) {
    return true;
  }

  const licenseStates = behavior.licenseStateList.split(",");
  const { isActive } = getPremiumState();

  for (const licenseState of licenseStates) {
    if (licenseState === LicenseState.inactive && !isActive) {
      return true;
    }

    if (licenseState === LicenseState.active && isActive) {
      return true;
    }
  }

  return false;
}
