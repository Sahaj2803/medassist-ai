import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ID_PREFIX,
  MAX_SCHEDULED,
  buildPlan,
  notificationContent,
  ownerOfIdentifier,
  reminderPrefix,
  signatureFor,
} from "../utils/notificationPlan";

// Local (on-device) scheduled notifications for medicine reminders.
// Entirely separate from the backend email reminders (reminderScheduler.js
// + emailService.js on the server) — nothing here talks to email.
//
// Public API is unchanged from earlier phases:
//   getPermissionStatus, requestPermission, syncReminder, cancelReminder,
//   syncAllReminders
// plus: ensureNotificationChannel, cancelAllScheduled.
//
// ROOT CAUSE FIXED HERE: the old code scheduled with a CALENDAR trigger,
// which expo-notifications only supports on iOS. On Android every
// scheduleNotificationAsync() call threw, and the empty `catch {}` swallowed
// it, so nothing was ever scheduled. We now use DAILY / DATE triggers
// (supported on both platforms) and report failures instead of hiding them.
//
// Idempotency: every notification gets a deterministic identifier
// ("med:<reminderId>:<slot>"). The OS scheduled list is the source of truth
// for what exists; the AsyncStorage map is only a signature cache so an
// unchanged reminder is a no-op. Losing the map can never create duplicates.

const MAP_KEY = "medassist_notification_map_v2";
const LEGACY_MAP_KEY = "medassist_notification_map_v1";
const CHANNEL_ID = "medicine-reminders";
const RECENT_WRITE_GUARD_MS = 60 * 1000;

const recentlySynced = new Map(); // reminderId -> timestamp of last syncReminder

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Never log medicine names / dosage / times — ids and error messages only.
function warn(message, err, extra) {
  console.warn(`[notifications] ${message}`, err?.message || "", extra || "");
}

// Serialise all scheduler operations so concurrent callers (login sync,
// resume sync, create/edit screens) cannot interleave cancel/schedule.
let chain = Promise.resolve();
function runExclusive(fn) {
  const run = chain.then(() => fn());
  chain = run.catch(() => {});
  return run;
}

// ---- channel + permission ----

export async function ensureNotificationChannel() {
  if (Platform.OS !== "android") return true;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Medicine Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC,
    });
    return true;
  } catch (e) {
    warn("Could not create Android notification channel", e);
    return false;
  }
}

export async function getPermissionStatus() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status; // 'granted' | 'denied' | 'undetermined'
  } catch (e) {
    warn("Could not read notification permission", e);
    return "undetermined";
  }
}

/**
 * Asks the OS for permission only when it can still be asked (never
 * re-prompts after a permanent denial). On Android 13+ the system prompt
 * only appears once a notification channel exists, so the channel is
 * created first.
 */
export async function requestPermission() {
  try {
    await ensureNotificationChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.status === "granted") return "granted";
    if (current.status === "denied" && current.canAskAgain === false) return "denied";
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return status;
  } catch (e) {
    warn("Notification permission request failed", e);
    return "denied";
  }
}

// ---- local signature cache ----

async function readMap() {
  try {
    const raw = await AsyncStorage.getItem(MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    warn("Could not read notification cache (will rebuild)", e);
    return {};
  }
}

async function writeMap(map) {
  try {
    await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map));
  } catch (e) {
    warn("Could not persist notification cache", e);
  }
}

async function dropLegacyMap() {
  try {
    await AsyncStorage.removeItem(LEGACY_MAP_KEY);
  } catch {
    // Best effort.
  }
}

// ---- OS scheduled-notification helpers ----

async function listManaged() {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    // Ours: new-style identifiers, plus legacy ones from earlier builds
    // (random UUID, but carrying data.reminderId).
    return (all || []).filter(
      (n) => n.identifier?.startsWith(ID_PREFIX) || n.content?.data?.reminderId
    );
  } catch (e) {
    warn("Could not list scheduled notifications", e);
    return null;
  }
}

function ownerOf(n) {
  return ownerOfIdentifier(n.identifier) || n.content?.data?.reminderId || null;
}

async function cancelNotifications(list) {
  let failed = 0;
  for (const n of list) {
    try {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    } catch (e) {
      failed += 1;
      warn("Could not cancel a scheduled notification", e);
    }
  }
  return failed;
}

async function scheduleItem(reminder, item) {
  const channel = Platform.OS === "android" ? { channelId: CHANNEL_ID } : {};
  const { title, body } = notificationContent(reminder, item.time);
  await Notifications.scheduleNotificationAsync({
    identifier: item.identifier,
    content: {
      title,
      body,
      sound: "default",
      data: {
        type: "medicine-reminder",
        reminderId: reminder._id,
        scheduledTime: item.time,
      },
    },
    trigger:
      item.type === "daily"
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: item.hour,
            minute: item.minute,
            ...channel,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: item.date,
            ...channel,
          },
  });
}

/**
 * Brings the OS schedule for ONE reminder in line with its plan.
 * ctx: { map, managed (array|null), granted, now, budget:{remaining} }
 */
async function applyReminder(reminder, ctx) {
  const id = reminder._id;
  const mine = (ctx.managed || []).filter((n) => ownerOf(n) === id);
  const plan = buildPlan(reminder, ctx.now);

  if (!ctx.granted) {
    await cancelNotifications(mine);
    delete ctx.map[id];
    return { ok: false, reason: "permission", scheduled: 0, failed: 0 };
  }
  if (plan.mode === "none") {
    const failed = await cancelNotifications(mine);
    delete ctx.map[id];
    return { ok: failed === 0, reason: failed ? "error" : plan.reason, scheduled: 0, failed };
  }

  const items = plan.items.slice(0, Math.max(0, ctx.budget.remaining));
  if (items.length < plan.items.length) {
    warn("Notification budget reached; some upcoming occurrences were not scheduled");
  }

  const wantedIds = new Set(items.map((i) => i.identifier));
  const sig = signatureFor(reminder, plan, ctx.now);
  const entry = ctx.map[id];
  const unchanged =
    ctx.managed !== null &&
    entry?.signature === sig &&
    mine.length === items.length &&
    mine.every((n) => wantedIds.has(n.identifier));

  if (unchanged) {
    ctx.budget.remaining -= items.length;
    return { ok: true, reason: plan.reason, scheduled: items.length, failed: 0 };
  }

  await cancelNotifications(mine);
  await ensureNotificationChannel();
  let scheduled = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await scheduleItem(reminder, item);
      scheduled += 1;
    } catch (e) {
      failed += 1;
      warn(`Scheduling failed for reminder ${id}`, e);
    }
  }
  ctx.budget.remaining -= scheduled;
  // Only cache the signature when everything succeeded, so a partial
  // failure is retried on the next sync instead of looking "done".
  if (failed === 0) ctx.map[id] = { signature: sig };
  else delete ctx.map[id];
  return {
    ok: failed === 0,
    reason: failed ? "error" : plan.reason,
    scheduled,
    failed,
  };
}

/**
 * (Re)schedule local notifications for a single reminder. Safe after
 * create, edit, or an active/inactive toggle: previous notifications for
 * this reminder are replaced, never duplicated.
 * Returns { ok, reason?, scheduled, failed } — callers must not show a
 * success state when ok is false (reason: "permission" | "error").
 */
export function syncReminder(reminder, opts = {}) {
  if (!reminder || !reminder._id) {
    return Promise.resolve({ ok: false, reason: "invalid", scheduled: 0, failed: 0 });
  }
  return runExclusive(async () => {
    try {
      const now = opts.now || new Date();
      const map = await readMap();
      const managed = await listManaged();
      const others = (managed || []).filter((n) => ownerOf(n) !== reminder._id).length;
      const granted = (await getPermissionStatus()) === "granted";
      const result = await applyReminder(reminder, {
        map,
        managed,
        granted,
        now,
        budget: { remaining: Math.max(0, MAX_SCHEDULED - others) },
      });
      recentlySynced.set(reminder._id, Date.now());
      await writeMap(map);
      return result;
    } catch (e) {
      warn(`syncReminder failed for ${reminder._id}`, e);
      return { ok: false, reason: "error", scheduled: 0, failed: 1 };
    }
  });
}

/** Cancel all local notifications for a reminder (e.g. after delete). */
export function cancelReminder(reminderId) {
  if (!reminderId) return Promise.resolve({ ok: true });
  return runExclusive(async () => {
    try {
      const map = await readMap();
      const managed = (await listManaged()) || [];
      const failed = await cancelNotifications(managed.filter((n) => ownerOf(n) === reminderId));
      delete map[reminderId];
      recentlySynced.delete(reminderId);
      await writeMap(map);
      return { ok: failed === 0 };
    } catch (e) {
      warn(`cancelReminder failed for ${reminderId}`, e);
      return { ok: false };
    }
  });
}

/**
 * Reconcile local schedules against the full, authoritative backend list.
 * Idempotent: unchanged reminders are left alone; anything scheduled for a
 * reminder that is gone / disabled / ineligible (or left over from another
 * account or an older build) is cancelled. Only call with a list that was
 * successfully fetched — never with an empty list on a network error.
 */
export function syncAllReminders(reminders, opts = {}) {
  return runExclusive(async () => {
    const summary = { ok: true, scheduled: 0, failed: 0, permission: "granted", cancelledOrphans: 0 };
    try {
      const now = opts.now || new Date();
      const map = await readMap();
      const managed = await listManaged();
      const granted = (await getPermissionStatus()) === "granted";
      summary.permission = granted ? "granted" : "not_granted";
      const budget = { remaining: MAX_SCHEDULED };
      const liveIds = new Set();

      for (const reminder of reminders || []) {
        if (!reminder || !reminder._id) continue;
        liveIds.add(reminder._id);
        const r = await applyReminder(reminder, { map, managed, granted, now, budget });
        summary.scheduled += r.scheduled;
        summary.failed += r.failed;
        if (!r.ok && r.reason === "error") summary.ok = false;
      }

      // Orphans: scheduled locally but no longer in the backend list.
      const guard = Date.now() - RECENT_WRITE_GUARD_MS;
      const orphans = (managed || []).filter((n) => {
        const owner = ownerOf(n);
        if (liveIds.has(owner)) return false;
        // A reminder created/edited moments ago may be newer than the list
        // we were handed; don't cancel it based on stale data.
        if ((recentlySynced.get(owner) || 0) > guard) return false;
        return true;
      });
      summary.cancelledOrphans = orphans.length;
      await cancelNotifications(orphans);
      for (const id of Object.keys(map)) {
        if (!liveIds.has(id) && !((recentlySynced.get(id) || 0) > guard)) delete map[id];
      }

      await writeMap(map);
      await dropLegacyMap();
      if (!granted) summary.ok = false;
    } catch (e) {
      warn("syncAllReminders failed", e);
      summary.ok = false;
    }
    return summary;
  });
}

/**
 * Logout policy: remove every locally scheduled medicine notification and
 * the signature cache so a signed-out device never alerts for (or leaks the
 * medicine names of) the previous account. Backend reminders are untouched;
 * the next login re-syncs from the backend.
 */
export function cancelAllScheduled() {
  return runExclusive(async () => {
    try {
      const managed = (await listManaged()) || [];
      await cancelNotifications(managed);
      recentlySynced.clear();
      await writeMap({});
      await dropLegacyMap();
      return { ok: true };
    } catch (e) {
      warn("cancelAllScheduled failed", e);
      return { ok: false };
    }
  });
}

export default {
  getPermissionStatus,
  requestPermission,
  ensureNotificationChannel,
  syncReminder,
  cancelReminder,
  syncAllReminders,
  cancelAllScheduled,
};
