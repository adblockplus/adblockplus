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

import { AuthRequestEvent, TrustedEvent } from "./public-api.types";

/**
 * List of events that are waiting to be processed
 */
const eventQueue: Event[] = [];
/**
 * Maximum number of failed requests after which events stop being handled
 */
const maxErrorThreshold = 30;
/**
 * Maximum number of events that can be queued up
 */
const maxQueuedEvents = 20;
/**
 * Interval period in milliseconds at which events are processed
 */
const processingDelay = 100;

/**
 * Number of failed requests
 */
let errorCount = 0;
/**
 * Interval identifier for processing events
 */
let processingIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Retrieves requested payload from background page
 *
 * @param event - "flattr-request-payload" DOM event
 *
 * @returns payload - Encoded signed Premium license data
 */
async function getPayload(event: Event): Promise<string | null> {
  if (!isTrustedEvent(event)) {
    return null;
  }

  if (!isAuthRequestEvent(event)) {
    return null;
  }

  const payload = (await browser.runtime.sendMessage({
    type: "premium.getAuthPayload",
    signature: event.detail.signature,
    timestamp: event.detail.timestamp
  })) as string | null;
  return payload;
}

/**
 * Queues up incoming requests
 *
 * @param event - "flattr-request-payload" DOM event
 */
function handleFlattrRequestPayloadEvent(event: Event): void {
  if (eventQueue.length >= maxQueuedEvents) {
    return;
  }

  eventQueue.push(event as AuthRequestEvent);
  startProcessingInterval();
}

/**
 * Checks whether event contains authentication data
 *
 * @param event - Event
 *
 * @returns whether event contains authentication data
 */
function isAuthRequestEvent(event: TrustedEvent): event is AuthRequestEvent {
  return (
    event.detail &&
    typeof event.detail.signature === "string" &&
    typeof event.detail.timestamp === "number"
  );
}

/**
 * Check whether incoming event hasn't been tampered with
 *
 * @param event - DOM event
 *
 * @returns whether the event can be trusted
 */
function isTrustedEvent(event: Event): event is TrustedEvent {
  return (
    Object.getPrototypeOf(event) === CustomEvent.prototype &&
    !Object.hasOwnProperty.call(event, "detail")
  );
}

/**
 * Processes incoming requests
 */
async function processNextEvent(): Promise<void> {
  const event = eventQueue.shift();
  if (event) {
    try {
      const payload = await getPayload(event);
      if (!payload) {
        throw new Error("Premium request rejected");
      }

      let detail = { detail: { payload } };
      if (typeof cloneInto === "function") {
        // Firefox requires content scripts to clone objects
        // that are passed to the document
        detail = cloneInto(detail, document.defaultView);
      }
      document.dispatchEvent(new CustomEvent("flattr-payload", detail));
      stop();
    } catch (ex) {
      errorCount += 1;
      if (errorCount >= maxErrorThreshold) {
        stop();
      }
    }
  }

  if (!eventQueue.length) {
    stopProcessingInterval();
  }
}

/**
 * Starts interval for processing incoming requests
 */
function startProcessingInterval(): void {
  if (processingIntervalId) {
    return;
  }

  processNextEvent();
  processingIntervalId = setInterval(processNextEvent, processingDelay);
}

/**
 * Stops interval for processing incoming requests
 */
function stopProcessingInterval(): void {
  if (processingIntervalId !== null) {
    clearInterval(processingIntervalId);
  }
  processingIntervalId = null;
}

/**
 * Initializes module
 */
function start(): void {
  document.addEventListener(
    "flattr-request-payload",
    handleFlattrRequestPayloadEvent,
    true
  );
}

/**
 * Uninitializes module
 */
function stop(): void {
  document.removeEventListener(
    "flattr-request-payload",
    handleFlattrRequestPayloadEvent,
    true
  );
  eventQueue.length = 0;
  stopProcessingInterval();
}

start();
