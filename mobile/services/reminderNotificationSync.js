import reminderApi from "./reminderApi";
import { syncAllReminders } from "./notificationScheduler";

const MIN_INTERVAL_MS = 60 * 1000;
const RATE_LIMIT_COOLDOWN_MS = 2 * 60 * 1000;
let inFlight = null;
let lastRunAt = 0;
let rateLimitedUntil = 0;

/**
 * Fetches the authoritative reminder list from the existing backend API and
 * reconciles on-device notifications with it. De-duplicates concurrent
 * callers and throttles resume-triggered runs. If the backend call fails
 * the existing local schedule is left untouched (never wiped).
 */
export function syncRemindersFromBackend({ force = false } = {}) {
  if (inFlight) return inFlight;
  const now = Date.now();
  // A 429 means the API has asked us to slow down. Do not immediately
  // retry on app resume or permission changes; preserve existing local alerts.
  if (now < rateLimitedUntil) {
    return Promise.resolve({ ok: false, reason: "rate-limited", retryAfter: rateLimitedUntil });
  }
  if (!force && now - lastRunAt < MIN_INTERVAL_MS) {
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
      if (e?.response?.status === 429) {
        rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        console.warn("[notifications] Reminder sync paused after HTTP 429; keeping existing local reminders.");
        return { ok: false, reason: "rate-limited", retryAfter: rateLimitedUntil };
      }
      console.warn("[notifications] Reminder sync skipped (backend fetch failed):", e?.message || "");
      return { ok: false, reason: "backend" };
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export default { syncRemindersFromBackend };
