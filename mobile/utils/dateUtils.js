/**
 * Plain "YYYY-MM-DD" date-string helpers for the reminder start/end date
 * range (Part 8). Kept deliberately separate from any time-of-day/timezone
 * concerns — reminder times (Part 2/3) already use their own "HH:mm"
 * strings in TimePickerField and are untouched by this file.
 *
 * Why not just use `new Date("YYYY-MM-DD")` / `date.toISOString()`?
 * A bare "YYYY-MM-DD" string is parsed by JS as UTC midnight, and
 * `toISOString()` always serializes in UTC. For anyone west of UTC, both
 * directions can silently shift the date by one day once you look at it
 * with local getters (or a native date picker, which always works in
 * local time). Every conversion here goes through the Date object's
 * *local* year/month/day components instead, so what the user picks is
 * exactly what gets sent, and what the backend sent back is exactly what
 * the picker opens to.
 */

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Local Date -> "YYYY-MM-DD", using local (not UTC) components. */
export function dateToDateString(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * "YYYY-MM-DD" (or a full ISO timestamp — only the leading date part is
 * used) -> local Date at local midnight. Returns null for anything that
 * isn't parseable, so callers can fall back to "no value" instead of
 * silently defaulting.
 */
export function dateStringToDate(value) {
  if (!value) return null;
  const match = DATE_ONLY_RE.exec(String(value));
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Today at local midnight, as a Date (handy default + comparison baseline). */
export function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Today as "YYYY-MM-DD". */
export function todayDateString() {
  return dateToDateString(todayDate());
}

/** True if `value` (Date) is strictly before `other` (Date), comparing dates only. */
export function isDateBefore(value, other) {
  if (!value || !other) return false;
  return dateToDateString(value) < dateToDateString(other);
}

/** Friendly display, e.g. "14 Sep 2026". */
export function formatDateDisplay(value) {
  const date = value instanceof Date ? value : dateStringToDate(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Normalizes any raw date value the backend might return (date-only or
 * full ISO timestamp) down to a plain "YYYY-MM-DD" string, or "" if unset/unparseable. */
export function normalizeDateString(raw) {
  if (!raw) return "";
  return dateToDateString(dateStringToDate(raw));
}

export default {
  dateToDateString,
  dateStringToDate,
  todayDate,
  todayDateString,
  isDateBefore,
  formatDateDisplay,
  normalizeDateString,
};
