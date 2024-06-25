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

import { error as logError } from "../../logger/background";

import { start as startContentFiltering } from "../../../adblockpluschrome/lib/contentFiltering.js";
import { start as startDebug } from "../../../adblockpluschrome/lib/debug.js";
import { start as startDevTools } from "../../../adblockpluschrome/lib/devtools.js";
import { start as startFilterConfiguration } from "../../../adblockpluschrome/lib/filterConfiguration.js";
import { start as startMessageResponder } from "../../../adblockpluschrome/lib/messageResponder.js";
import { start as startStats } from "../../../adblockpluschrome/lib/stats.js";
import { start as startTabSessionStorage } from "../../../adblockpluschrome/lib/storage/tab-session";
import { start as startSubscriptionInit } from "../../../adblockpluschrome/lib/subscriptionInit.js";
import { start as startUninstall } from "../../../adblockpluschrome/lib/uninstall.js";
import { start as startInit } from "../../../lib/init.js";
import { start as startRecommendedLanguage } from "../../../lib/recommendLanguage.js";
import { start as startAllowListing } from "../../allowlisting/background";
import { start as startBypass } from "../../bypass/background";
import { start as startComposer } from "../../composer/background";
import { start as startIPM } from "../../ipm/background";
import { start as startNewTab } from "../../new-tab/background";
import { start as startOnPageDialog } from "../../onpage-dialog/background";
import { start as startPremiumOnboarding } from "../../premium-onboarding/background";
import { start as startPremiumSubscriptions } from "../../premium-subscriptions/background";
import { start as startReadyState } from "../../testing/ready-state/background";
import { start as startYTWallDetection } from "../../yt-wall-detection/background";
import { start as startInfoInjector } from "../../info-injector/background";
import { start as startUpdateCampaign } from "../../update-campaign/background";

async function bootstrap(): Promise<void> {
  startTabSessionStorage();
  startDevTools();
  startDebug();
  void startIPM().catch(logError);
  startReadyState();
  startFilterConfiguration();
  startStats();
  void startSubscriptionInit();
  startInit();
  void startRecommendedLanguage();
  startComposer();
  startUninstall();
  void startContentFiltering();
  startMessageResponder();
  void startAllowListing().catch(logError);
  startBypass();
  void startOnPageDialog().catch(logError);
  void startNewTab().catch(logError);
  startPremiumOnboarding();
  startPremiumSubscriptions();
  startYTWallDetection();
  startInfoInjector();
  startUpdateCampaign();
}

void bootstrap();
