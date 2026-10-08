import reminderApi from "./reminderApi";
import { syncAllReminders } from "./notificationScheduler";

const MIN_INTERVAL_MS = 15 * 1000;
let inFlight = null;
let lastRunAt = 0;

/**
 * Fetches the authoritative reminder list from the existing backend API and
 * reconciles on-device notifications with it. De-duplicates concurrent
 * callers and throttles resume-triggered runs. If the backend call fails
 * the existing local schedule is left untouched (never wiped).
 */
export function syncRemindersFromBackend({ force = false } = {}) {
  if (inFlight) return inFlight;
  if (!force && Date.now() - lastRunAt < MIN_INTERVAL_MS) {
    return Promise.resolve({ ok: true, skipped: "throttled" });
  }
  inFlight = (async () => {
    try {
      const data = await reminderApi.list();
      if (!Array.isArray(data?.reminders)) throw new Error("Unexpected reminders response");
      const result = await syncAllReminders(data.reminders);
      lastRunAt = Date.now();
      return result;
    } catch (e) {
      console.warn("[notifications] Reminder sync skipped (backend fetch failed):", e?.message || "");
      return { ok: false, reason: "backend" };
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export default { syncRemindersFromBackend };
