import AsyncStorage from "@react-native-async-storage/async-storage";
import reminderApi from "./reminderApi";

/**
 * Part 4 — Taken/Missed dose tracking + medication adherence.
 *
 * The authoritative source for dose status is always the existing backend
 * (`PUT /reminders/:id/mark`, `GET /reminders/today`, `GET /reminders/stats`
 * — all already used by the app since Part 2/3, see services/reminderApi.js).
 * Nothing here invents data: every occurrence rendered anywhere comes from
 * one of those endpoints.
 *
 * Two things the backend does not do for us, given only these three
 * endpoints to work with:
 *
 *  1. There is no server-side cron marking a stale dose "missed" that we
 *     can see from the mobile app. So this file detects "scheduled time +
 *     grace period has passed and the dose is still due/pending" locally,
 *     on load, and persists it by calling the SAME existing `mark`
 *     endpoint with status "missed" — no new backend route, no local-only
 *     status. This is a client-triggered, server-persisted transition.
 *
 *  2. `GET /reminders/today` only ever returns *today's* occurrences, and
 *     there is no dedicated multi-day history endpoint in this API surface.
 *     So each time we fetch today's real, backend-returned occurrences, we
 *     also keep a small local rolling cache of that same real data (never
 *     fabricated) purely so the History screen can show more than just
 *     today once the backend endpoint list is exhausted. If `/reminders/stats`
 *     turns out to already include a per-dose history array, that server
 *     data is always preferred over the local cache for any date it covers.
 */

export const GRACE_PERIOD_MINUTES = 30;
const HISTORY_CACHE_KEY = "medassist_dose_history_cache_v1";
const HISTORY_CACHE_MAX_DAYS = 30;

// ---- status helpers ----

/** Collapses the backend's finer-grained statuses into the 3 required by Part 4. */
export function getDisplayStatus(status) {
  if (status === "taken") return "taken";
  if (status === "missed") return "missed";
  return "upcoming"; // covers "due", "pending", or anything else not-yet-resolved
}

export function isResolved(status) {
  return status === "taken" || status === "missed";
}

function dateKey(d) {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function occurrenceKey(o) {
  return `${o.reminderId}__${o.scheduledFor}`;
}

function isPastGracePeriod(scheduledFor) {
  const scheduled = new Date(scheduledFor).getTime();
  if (Number.isNaN(scheduled)) return false;
  return Date.now() - scheduled > GRACE_PERIOD_MINUTES * 60 * 1000;
}

// ---- auto-missed (client-detected, server-persisted) ----

/**
 * Given today's real occurrences from the backend, finds any that are still
 * unresolved (upcoming) but are past their scheduled time + grace period,
 * marks them "missed" via the existing mark endpoint, and returns a new
 * array with those statuses updated. Never marks anything the user hasn't
 * actually missed, and never touches already-resolved (taken/missed) doses.
 * Best-effort: a failed mark call is silently skipped and simply
 * re-attempted next time this runs (e.g. next screen focus).
 */
export async function autoResolveMissed(occurrences) {
  const toMark = (occurrences || []).filter(
    (o) => !isResolved(o.status) && isPastGracePeriod(o.scheduledFor)
  );
  if (toMark.length === 0) return occurrences || [];

  const results = await Promise.allSettled(
    toMark.map((o) => reminderApi.mark(o.reminderId, o.scheduledFor, "missed"))
  );

  const succeededKeys = new Set(
    toMark.filter((_, i) => results[i].status === "fulfilled").map(occurrenceKey)
  );
  if (succeededKeys.size === 0) return occurrences || [];

  return (occurrences || []).map((o) =>
    succeededKeys.has(occurrenceKey(o)) ? { ...o, status: "missed" } : o
  );
}

// ---- local rolling cache (real backend data, cached for multi-day history) ----

async function readCache() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeCache(cache) {
  try {
    // Trim to the most recent HISTORY_CACHE_MAX_DAYS days so this never grows unbounded.
    const days = Object.keys(cache).sort().reverse().slice(0, HISTORY_CACHE_MAX_DAYS);
    const trimmed = {};
    for (const d of days) trimmed[d] = cache[d];
    await AsyncStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // Non-fatal — worst case the history view is missing a day until next fetch.
  }
}

/**
 * Caches today's real occurrences (as returned by the backend, post
 * auto-resolve) under today's date key, merged with anything already
 * cached for that date so an item marked taken by the user updates the
 * cached copy too.
 */
export async function cacheTodaySnapshot(occurrences) {
  if (!occurrences || occurrences.length === 0) return;
  const cache = await readCache();
  const key = dateKey(new Date());
  const existing = cache[key] || {};
  for (const o of occurrences) {
    existing[occurrenceKey(o)] = o;
  }
  cache[key] = existing;
  await writeCache(cache);
}

/** Flattened, most-recent-first list of every cached occurrence across days. */
async function getCachedOccurrences() {
  const cache = await readCache();
  const all = [];
  for (const key of Object.keys(cache)) {
    for (const o of Object.values(cache[key])) all.push(o);
  }
  all.sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor));
  return all;
}

// ---- adherence ----

function parseStatsResponse(raw) {
  if (!raw || typeof raw !== "object") return null;
  const src = raw.stats && typeof raw.stats === "object" ? raw.stats : raw;

  const taken = src.taken ?? src.takenCount ?? src.totalTaken;
  const missed = src.missed ?? src.missedCount ?? src.totalMissed;
  let percentage =
    src.adherenceRate ?? src.adherencePercentage ?? src.percentage ?? src.rate ?? null;

  if (percentage == null && typeof taken === "number" && typeof missed === "number") {
    const total = taken + missed;
    percentage = total > 0 ? Math.round((taken / total) * 100) : null;
  }
  // Normalize a 0-1 fraction to a 0-100 percentage.
  if (typeof percentage === "number" && percentage > 0 && percentage <= 1) {
    percentage = Math.round(percentage * 100);
  }

  if (percentage == null && typeof taken !== "number" && typeof missed !== "number") {
    return null; // Nothing usable in this response shape.
  }

  return {
    percentage: typeof percentage === "number" ? percentage : null,
    taken: typeof taken === "number" ? taken : null,
    missed: typeof missed === "number" ? missed : null,
  };
}

/**
 * Real medication-adherence summary. Prefers the backend's own
 * `/reminders/stats` aggregate (whatever shape it returns); if that
 * endpoint is unavailable or its shape can't be parsed, falls back to
 * computing the same percentage from the locally cached, backend-sourced
 * occurrence history so the app still shows something useful rather than
 * inventing a number.
 */
export async function getAdherenceSummary() {
  try {
    const raw = await reminderApi.stats();
    const parsed = parseStatsResponse(raw);
    if (parsed) return { ...parsed, source: "server" };
  } catch {
    // Fall through to local computation.
  }

  const cached = await getCachedOccurrences();
  const resolved = cached.filter((o) => isResolved(o.status));
  const taken = resolved.filter((o) => o.status === "taken").length;
  const missed = resolved.filter((o) => o.status === "missed").length;
  const total = taken + missed;
  return {
    percentage: total > 0 ? Math.round((taken / total) * 100) : null,
    taken,
    missed,
    source: "local",
  };
}

// ---- history ----

function extractServerHistory(raw) {
  if (!raw || typeof raw !== "object") return [];
  const candidates = raw.history || raw.recentDoses || raw.recent || raw.doses || raw.occurrences;
  return Array.isArray(candidates) ? candidates : [];
}

/**
 * Simple dose history: most-recent-first list of resolved (taken/missed)
 * occurrences, grouped by day. Merges whatever the backend's `/stats`
 * response includes (if it includes per-dose entries) with the local
 * rolling cache of real `today()` fetches, de-duplicated by
 * reminder + scheduled time so nothing is double-counted.
 */
export async function getDoseHistory() {
  let serverEntries = [];
  try {
    const raw = await reminderApi.stats();
    serverEntries = extractServerHistory(raw);
  } catch {
    // No server history available — local cache below still works.
  }

  const cachedEntries = await getCachedOccurrences();
  const merged = new Map();
  for (const o of cachedEntries) merged.set(occurrenceKey(o), o);
  for (const o of serverEntries) merged.set(occurrenceKey(o), o); // server wins on overlap

  const resolved = Array.from(merged.values()).filter((o) => isResolved(o.status));
  resolved.sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor));

  const groups = [];
  const byDate = new Map();
  for (const o of resolved) {
    const key = dateKey(o.scheduledFor);
    if (!byDate.has(key)) {
      const group = { date: key, items: [] };
      byDate.set(key, group);
      groups.push(group);
    }
    byDate.get(key).items.push(o);
  }
  return groups;
}

/**
 * Fetches today's occurrences from the backend, auto-resolves any that
 * have passed their grace period into "missed" (persisted server-side),
 * caches the real result locally for the History screen, and returns the
 * resolved list. Use this instead of calling reminderApi.today() directly
 * so every screen gets consistent Taken/Missed behavior.
 */
export async function fetchTodayOccurrences() {
  const { occurrences } = await reminderApi.today();
  const resolved = await autoResolveMissed(occurrences || []);
  await cacheTodaySnapshot(resolved);
  return resolved;
}

export default {
  GRACE_PERIOD_MINUTES,
  getDisplayStatus,
  isResolved,
  autoResolveMissed,
  cacheTodaySnapshot,
  getAdherenceSummary,
  getDoseHistory,
  fetchTodayOccurrences,
};
