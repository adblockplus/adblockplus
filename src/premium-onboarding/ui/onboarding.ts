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

import { initI18n } from "../../../js/i18n.mjs";
import { $, $$ } from "../../../js/dom.mjs";
import api from "../../core/api/front";
import { closeCurrentTab } from "../../polyfills/ui";

import "../../components/ui/io-checkbox.css";
import IOCheckbox from "../../../js/io-checkbox.mjs";
import "./onboarding.css";

/**
 * Enable all features
 */
function enableAllFeatures(): void {
  const checkboxes = $$(".feature io-checkbox:not([disabled])");
  for (const checkbox of checkboxes) {
    checkbox.checked = true;
  }
  finish();
}

/**
 * Finish choosing features
 */
function finish(): void {
  document.body.classList.add("chosen");
}

/**
 * Initializes call-to-actions
 */
async function initCtas(): Promise<void> {
  $("#cta-enable-all").addEventListener("click", enableAllFeatures);
  $("#cta-enable-none").addEventListener("click", finish);
  $("#cta-finish").addEventListener("click", closeCurrentTab);

  const upgradeUrl = await api.ctalinks.get("premium-upgrade", {
    source: "onboarding"
  });
  $("#cta-upgrade").setAttribute("href", upgradeUrl);
}

/**
 * Initializes feature choices
 */
async function initFeatureChoices(): Promise<void> {
  const recommendations = await api.subscriptions.getRecommendations();
  for (const recommendation of recommendations) {
    const checkbox = $(
      `.feature io-checkbox[data-feature="${recommendation.type}"]`
    );
    if (!checkbox) {
      continue;
    }

    checkbox.dataset.url = recommendation.url;
    checkbox.addEventListener("change", onFeatureChanged);
  }
}

/**
 * Initializes options page link
 */
function initOptionsPageLink(): void {
  const optionsPageLink = $("#finish-description [data-i18n-index='0']");
  if (!optionsPageLink) {
    console.error("No options page link found");
    return;
  }

  optionsPageLink.href = "#";
  optionsPageLink.addEventListener("click", openOptionsPage);
}

/**
 * Initializes Premium state
 */
async function initPremiumState(): Promise<void> {
  const state = await api.premium.get();
  if (!state.isActive) {
    return;
  }

  const checkboxes = $$(".feature:not(.alwayson) io-checkbox");
  for (const checkbox of checkboxes) {
    checkbox.disabled = false;
  }
  document.body.classList.add("premium");
}

/**
 * Handle feature changes
 *
 * @param event - Feature changed event
 */
function onFeatureChanged(event: Event): void {
  const element = event.currentTarget;
  if (!(element instanceof IOCheckbox)) {
    return;
  }

  const { url } = element.dataset;
  if (typeof url !== "string") {
    return;
  }

  if (element.checked) {
    void api.subscriptions.add(url);
  } else {
    void api.subscriptions.remove(url);
  }
  finish();
}

/**
 * Open options page
 *
 * @param event - Click event
 */
function openOptionsPage(event: Event): void {
  event.preventDefault();

  void api.app.open("options");
}

/**
 * Initializes Premium onboarding page
 */
function start(): void {
  initI18n();
  void initPremiumState();
  void initFeatureChoices();
  void initCtas();
  initOptionsPageLink();

  document.body.hidden = false;
}

start();
