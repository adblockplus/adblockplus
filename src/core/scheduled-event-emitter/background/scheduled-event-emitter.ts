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
  type Schedule,
  type Listener,
  ScheduleType
} from "./scheduled-event-emitter.types";

import { SessionStorage } from "../../../../adblockpluschrome/lib/storage/session";

/**
 * The ScheduledEventEmitter allows to schedule emission of events.
 *
 * The schedule will be persisted so that it survives the ServiceWorker going
 * away. Note that it will be persisted in SessionStorage, so it won't
 * survive browser/extension restarts.
 *
 * The listeners however can't be persisted, so make sure to re-subscribe on
 * ServiceWorker wake-ups.
 *
 * @example
 *   // plan to emit 'my-event' in an hour
 *   setSchedule('my-event', 60 * 60 * 1000);
 *
 *   // listen to the event
 *   setListener('my-event', () => {
 *      console.log('🕰 Ding! An hour has passed.');
 *   });
 *
 */

/**
 * The key under which the ScheduledEventEmitter persists the schedules.
 */
const storageKey = "schedules";

/**
 * A reference to the SessionStorage instance.
 */
const storage = new SessionStorage("ScheduledEventEmitter.storage");

/**
 * A Promise that resolves once the ScheduledEventEmitter is fully initialized.
 */
const initialization = initialize();

/**
 * The map of schedules. Keys are event names.
 *
 * Can't be of type `Map` because that can't be persisted in the
 * extension session storage.
 */
let schedules: Record<string, Schedule> = Object.create(null);

/**
 * The map of listeners. Keys are event names.
 */
const listeners = new Map<string, Listener>();

/**
 * Registers a listener for the given event name. Will replace any existing
 * registration.
 *
 * When called, the listener will receive one argument, an object that
 * will provide some information about the call.
 *
 * @example
 *   setListener('my-event', (info) => {
 *     // `callCount` is the number of the current call of the listener.
 *     console.log(`This is call #${info.callCount} of this listener.`);
 *   });
 *
 * @param name The event name to register the listener for
 * @param listener The listener to register
 */
export async function setListener(
  name: string,
  listener: Listener
): Promise<void> {
  await initialization;

  if (listeners.has(name)) {
    warn(`Overwriting already registered listener for event "${name}".`);
  }
  listeners.set(name, listener);
  activateSchedules();
}

/**
 * Schedules the emission of the given event. Will replace any existing
 * schedule.
 *
 * @example
 *   // emit 'my-event' in 30 secs
 *   setSchedule('my-event', 30 * 1000);
 *
 *   // emit 'my-event' every 500 ms
 *   setSchedule('my-event', 500, ScheduleType.interval);
 *
 * @param name The event name to emit
 * @param time The time in ms when the event should be emitted
 * @param scheduleType Whether the emission should be one-off or recurring
 */
export async function setSchedule(
  name: string,
  time: number,
  scheduleType: ScheduleType = ScheduleType.once
): Promise<void> {
  await initialization;

  if (name in schedules) {
    warn(`Overwriting already registered schedule for name "${name}".`);
  }

  schedules[name] = {
    period: time,
    next: time + Date.now(),
    runOnce: scheduleType === ScheduleType.once,
    count: 0
  };
  await persistSchedules();
  activateSchedules();
}

/**
 * Removes a schedule.
 *
 * @param name The event name to remove the schedule for
 */
export async function removeSchedule(name: string): Promise<void> {
  await initialization;

  const schedule = schedules[name];
  if (!schedule) {
    return;
  }

  if (schedule.runOnce) {
    self.clearTimeout(schedule.activationId);
  } else {
    self.clearInterval(schedule.activationId);
  }

  // We can't use a Map or Set for `schedules`, so we need dynamic deletion
  // here.
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete schedules[name];
  await persistSchedules();
}

/**
 * Checks whether a schedule exists for the given event name.
 *
 * @param name The event name to check for
 * @returns Whether a schedule exists for the given event name
 */
export function hasSchedule(name: string): boolean {
  return name in schedules;
}

/**
 * Removes a listener.
 *
 * @param name The event name to remove the listener for
 */
export async function removeListener(name: string): Promise<void> {
  await initialization;
  listeners.delete(name);
}

/**
 * Initializes the ScheduledEventEmitter
 */
async function initialize(): Promise<void> {
  await reviveSchedules();
}

/**
 * Saves the schedules to session storage.
 */
async function persistSchedules(): Promise<void> {
  await storage.set(storageKey, schedules);
}

/**
 * Restores schedules from session storage.
 */
async function reviveSchedules(): Promise<void> {
  const storedSchedules = await storage.get(storageKey);

  if (Object.prototype.toString.call(storedSchedules) !== "[object Object]") {
    // Whatever it is, we can't work with it.
    warn("Could not restore stored schedules.");
    return;
  }

  schedules = storedSchedules;

  // Need to reset activation state
  Object.keys(schedules).forEach((name) => {
    delete schedules[name].activationId;
  });
}

/**
 * Checks schedules to see if emissions are due.
 */
function activateSchedules(): void {
  const now = Date.now();

  Object.entries(schedules).forEach(([name, schedule]) => {
    const delta = schedule.next - now;
    const isDue = delta <= 0;
    const activationKey: keyof Schedule = "activationId";

    if (activationKey in schedule) {
      // Upcoming emissions for this event are already planned, nothing
      // to do.
      return;
    }

    if (!schedule.runOnce) {
      // Intervals are to start immediately.
      schedule.activationId = self.setInterval(() => {
        void emitEvent(name);
      }, schedule.period);
      return;
    }

    if (!isDue) {
      // A timeout that is not due yet and needs to be planned.
      schedule.activationId = self.setTimeout(() => {
        void emitEvent(name);
      }, delta);
      return;
    }

    // Finally, a timeout that is already due, and needs to be emitted
    // right away.
    void emitEvent(name);
  });
}

/**
 * Emits the given event.
 *
 * @param name The event name to emit
 */
async function emitEvent(name: string): Promise<void> {
  const schedule = schedules[name];
  const listener = listeners.get(name);

  if (!schedule || !listener) {
    return;
  }

  schedule.count += 1;
  const now = Date.now();
  const callCount = schedule.count;

  listener({ callCount });

  if (schedule.runOnce) {
    await removeSchedule(name);
  } else {
    schedule.next = now + schedule.period;
    await persistSchedules();
  }
}

/**
 * Logs a warning message to the console.
 *
 * @param message The message to log
 */
function warn(message: string): void {
  console.warn(`[ScheduledEventEmitter]: ${message}`);
}
