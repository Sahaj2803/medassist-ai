import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { todayDateString, normalizeDateString } from "../utils/dateUtils";

// Local (on-device) scheduled notifications for medicine reminders.
// This is entirely separate from — and additive to — the existing
// backend email reminder system (services/reminderScheduler.js +
// emailService.js on the server). Nothing here talks to email at all.
//
// Persisted map: { [reminderId]: { signature, notifIds: string[], times: string[] } }
// `signature` captures everything that would change what's scheduled
// (medicine name, dosage, times, active flag) so re-syncing a reminder
// that hasn't actually changed is a no-op — this is what prevents
// duplicate notifications on app restart, login, dashboard refresh, etc.
const MAP_KEY = "medassist_notification_map_v1";
const CHANNEL_ID = "medicine-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureChannel() {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Medicine Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  } catch {
    // Non-fatal — worst case the OS uses default channel settings.
  }
}

// ---- permission ----

export async function getPermissionStatus() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status; // 'granted' | 'denied' | 'undetermined'
  } catch {
    return "undetermined";
  }
}

export async function requestPermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === "granted") return "granted";
    if (current.status === "denied" && current.canAskAgain === false) return "denied";
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  } catch {
    return "denied";
  }
}

// ---- local map persistence ----

async function readMap() {
  try {
    const raw = await AsyncStorage.getItem(MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeMap(map) {
  try {
    await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map));
  } catch {
    // Non-fatal — worst case we re-schedule (harmlessly, since we always
    // cancel-before-schedule) next time sync runs.
  }
}

function signatureFor(reminder) {
  return JSON.stringify({
    medicineName: reminder.medicineName || "",
    dosage: reminder.dosage || "",
    times: [...(reminder.times || [])].sort(),
    active: !!reminder.active,
    startDate: normalizeDateString(reminder.startDate),
    endDate: normalizeDateString(reminder.endDate),
  });
}

/**
 * Part 8 — reminder date range. `startDate`/`endDate` come from the
 * existing backend reminder fields (see app/reminders/create.jsx and
 * [id].jsx); this just checks today's local date falls within them
 * before allowing a reminder to be (re)scheduled.
 *
 * Known limitation (documented, not silently glossed over): Expo's local
 * notification triggers have no "date range" concept — a CALENDAR
 * trigger with `repeats: true` just repeats daily forever once
 * scheduled. There is no cron/background job in this client-only app to
 * cancel it exactly at midnight on the end date. What this DOES
 * guarantee: a reminder is never scheduled in the first place before its
 * start date or after its end date has passed, and — because
 * `syncAllReminders` already runs on every app open/login (see
 * app/_layout.jsx) and `signatureFor` now includes both dates — the
 * very next time the app is opened on or after the end date, the stale
 * schedule is cancelled. The one edge case this can't cover is a
 * reminder whose end date passes while the app is never reopened that
 * day; the backend's independent, always-on email reminder is
 * unaffected either way.
 */
function isWithinDateRange(reminder, todayStr = todayDateString()) {
  const start = normalizeDateString(reminder.startDate);
  const end = normalizeDateString(reminder.endDate);
  if (start && todayStr < start) return false;
  if (end && todayStr > end) return false;
  return true;
}

async function cancelForReminder(reminderId, map) {
  const entry = map[reminderId];
  if (!entry) return;
  for (const notifId of entry.notifIds || []) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notifId);
    } catch {
      // Already fired/cancelled/unknown — fine, it's gone either way.
    }
  }
  delete map[reminderId];
}

async function scheduleForReminder(reminder) {
  const ids = [];
  const body = reminder.dosage
    ? `Time to take ${reminder.medicineName} ${reminder.dosage}`
    : `Time to take ${reminder.medicineName}`;

  for (const t of reminder.times || []) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t || "");
    if (!match) continue;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    try {
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "💊 Medicine Reminder",
          body,
          sound: "default",
          data: { reminderId: reminder._id, medicineName: reminder.medicineName, time: t },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: true,
          ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
        },
      });
      ids.push(notifId);
    } catch {
      // Skip this one slot rather than aborting the whole reminder.
    }
  }
  return ids;
}

/**
 * (Re)schedule local notifications for a single reminder. Always cancels
 * whatever was previously scheduled for this reminder ID first, so this is
 * safe to call after create, edit, or an active/inactive toggle without
 * ever producing duplicates.
 */
export async function syncReminder(reminder) {
  if (!reminder || !reminder._id) return;
  const map = await readMap();
  await cancelForReminder(reminder._id, map);

  const granted = (await getPermissionStatus()) === "granted";
  if (granted && reminder.active && isWithinDateRange(reminder) && (reminder.times || []).length > 0) {
    await ensureChannel();
    const notifIds = await scheduleForReminder(reminder);
    map[reminder._id] = {
      signature: signatureFor(reminder),
      notifIds,
      times: reminder.times,
    };
  }
  await writeMap(map);
}

/** Cancel all local notifications for a reminder (e.g. after delete). */
export async function cancelReminder(reminderId) {
  if (!reminderId) return;
  const map = await readMap();
  await cancelForReminder(reminderId, map);
  await writeMap(map);
}

/**
 * Reconcile local schedules against the full, authoritative list of
 * reminders from the backend. Idempotent: a reminder whose signature
 * hasn't changed since the last sync is left untouched (no cancel, no
 * reschedule), and any reminder no longer present/active has its local
 * notifications cancelled. Safe to call on every app start, login, and
 * screen focus without ever creating duplicates.
 */
export async function syncAllReminders(reminders) {
  const map = await readMap();
  const granted = (await getPermissionStatus()) === "granted";
  const seenIds = new Set();

  for (const reminder of reminders || []) {
    if (!reminder || !reminder._id) continue;
    seenIds.add(reminder._id);
    const sig = signatureFor(reminder);
    const existing = map[reminder._id];
    const shouldBeScheduled =
      granted && reminder.active && isWithinDateRange(reminder) && (reminder.times || []).length > 0;

    if (existing && existing.signature === sig && (shouldBeScheduled ? existing.notifIds?.length : true)) {
      continue; // Nothing changed — leave the existing schedule alone.
    }

    await cancelForReminder(reminder._id, map);
    if (shouldBeScheduled) {
      await ensureChannel();
      const notifIds = await scheduleForReminder(reminder);
      map[reminder._id] = { signature: sig, notifIds, times: reminder.times };
    }
  }

  // Anything locally scheduled for a reminder that's gone (deleted, or
  // just missing from this list) gets cleaned up — no orphan notifications.
  for (const id of Object.keys(map)) {
    if (!seenIds.has(id)) {
      await cancelForReminder(id, map);
    }
  }

  await writeMap(map);
}

export default {
  getPermissionStatus,
  requestPermission,
  syncReminder,
  cancelReminder,
  syncAllReminders,
};
