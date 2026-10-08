import { dateToDateString, normalizeDateString } from "./dateUtils";

/**
 * Pure (no React Native / Expo imports) planning logic for on-device
 * medicine reminder notifications, so it can be unit-tested in plain Node.
 *
 * Backend contract preserved (see backend/models/Reminder.js):
 *   times:     ["HH:mm", ...]  daily clock times
 *   startDate: required date,  endDate: optional (null = ongoing, inclusive)
 *   active:    boolean
 * No new recurrence semantics are introduced: a reminder is "every listed
 * time, every day, from startDate through endDate".
 *
 * TIMEZONE ASSUMPTION (documented, unchanged from the backend): the
 * backend interprets "HH:mm" in its APP_TIMEZONE (default Asia/Kolkata) and
 * has no per-user timezone. Local notifications fire in the DEVICE's local
 * time. They agree whenever the phone is in the same timezone as the
 * backend's APP_TIMEZONE (e.g. IST).
 *
 * Scheduling strategy (bounded, never unlimited):
 *  - "daily": ongoing reminder (no end date) that has already started ->
 *    one repeating DAILY trigger per time slot. Needs no refill, keeps
 *    working even if the app is not opened for weeks.
 *  - "dates": reminders with an end date, or that start in the future ->
 *    one-shot DATE triggers for each occurrence in the next WINDOW_DAYS
 *    days (never past the end date, never in the past). Re-planned on
 *    every sync (login, app resume, reminder screens).
 *  - A global cap MAX_SCHEDULED keeps us under iOS's 64 pending limit.
 */

export const ID_PREFIX = "med:";
export const WINDOW_DAYS = 14;
export const MAX_SCHEDULED = 60;
const MIN_LEAD_MS = 5000; // never schedule something already due "right now"
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTime(t) {
  const m = TIME_RE.exec(String(t || "").trim());
  return m ? { hour: Number(m[1]), minute: Number(m[2]), time: `${m[1]}:${m[2]}` } : null;
}

export function reminderPrefix(reminderId) {
  return `${ID_PREFIX}${reminderId}:`;
}

/** Reminder id encoded in one of our identifiers, or null (legacy/foreign). */
export function ownerOfIdentifier(identifier) {
  if (typeof identifier !== "string" || !identifier.startsWith(ID_PREFIX)) return null;
  return identifier.slice(ID_PREFIX.length).split(":")[0] || null;
}

function validTimes(reminder) {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(reminder?.times) ? reminder.times : []) {
    const p = parseTime(raw);
    if (p && !seen.has(p.time)) {
      seen.add(p.time);
      out.push(p);
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return dateToDateString(new Date(y, m - 1, d + n));
}

/**
 * @returns {{mode:"daily"|"dates"|"none", reason?:string, items:Array}}
 * item: { identifier, type:"daily"|"date", hour, minute, time, date?: Date }
 */
export function buildPlan(reminder, now = new Date(), windowDays = WINDOW_DAYS) {
  if (!reminder || !reminder._id) return { mode: "none", reason: "invalid", items: [] };
  if (!reminder.active) return { mode: "none", reason: "inactive", items: [] };
  const slots = validTimes(reminder);
  if (slots.length === 0) return { mode: "none", reason: "no_times", items: [] };

  const today = dateToDateString(now);
  const start = normalizeDateString(reminder.startDate);
  const end = normalizeDateString(reminder.endDate);
  if (end && today > end) return { mode: "none", reason: "expired", items: [] };

  const id = reminder._id;

  if (!end && (!start || start <= today)) {
    return {
      mode: "daily",
      items: slots.map((s) => ({
        identifier: `${reminderPrefix(id)}daily:${s.time}`,
        type: "daily",
        hour: s.hour,
        minute: s.minute,
        time: s.time,
      })),
    };
  }

  const first = start && start > today ? start : today;
  const windowEnd = addDays(today, windowDays - 1);
  const last = end && end < windowEnd ? end : windowEnd;
  const items = [];
  for (let day = first; day <= last; day = addDays(day, 1)) {
    const [y, m, d] = day.split("-").map(Number);
    for (const s of slots) {
      const date = new Date(y, m - 1, d, s.hour, s.minute, 0, 0);
      if (date.getHours() !== s.hour) continue; // nonexistent local time (DST gap)
      if (date.getTime() <= now.getTime() + MIN_LEAD_MS) continue; // past / imminent
      items.push({
        identifier: `${reminderPrefix(id)}${day}:${s.time}`,
        type: "date",
        hour: s.hour,
        minute: s.minute,
        time: s.time,
        date,
      });
    }
  }
  items.sort((a, b) => a.date - b.date);
  return { mode: "dates", reason: items.length ? undefined : "outside_window", items };
}

/** Everything that changes what should be scheduled. */
export function signatureFor(reminder, plan, now = new Date()) {
  return JSON.stringify({
    v: 2,
    name: reminder.medicineName || "",
    dosage: reminder.dosage || "",
    times: validTimes(reminder).map((s) => s.time),
    active: !!reminder.active,
    start: normalizeDateString(reminder.startDate),
    end: normalizeDateString(reminder.endDate),
    mode: plan.mode,
    // Windowed plans depend on "today"; daily plans do not.
    day: plan.mode === "dates" ? dateToDateString(now) : "",
  });
}

export function notificationContent(reminder, time) {
  const name = String(reminder.medicineName || "your medicine").slice(0, 60);
  const dosage = reminder.dosage ? ` ${String(reminder.dosage).slice(0, 30)}` : "";
  return {
    title: "MedAssist AI — Medicine Reminder",
    body: `Time to take ${name}${dosage} (${time}). Open MedAssist AI to log your dose.`,
  };
}
