import api from "./api";

/**
 * The health-score endpoint's payload has been handled two different ways
 * across this codebase's history: as the score object itself
 * (`{ available, score, overall, positives, needsAttention }`, matching
 * how HealthScoreRing documents healthScoreService.getHealthScore()'s
 * return shape) and, defensively, as that object nested under a `score`
 * key. Screens were previously guessing between the two with
 * `result.score ?? result`, which breaks silently for the flat shape: the
 * numeric `score` field (e.g. `82`) is truthy, so `result.score` "wins"
 * and the screen ends up treating a bare number as the whole payload.
 * `available` is then `undefined` on that number, so every screen falls
 * into the "Not enough data yet" empty state regardless of the user's
 * actual data.
 *
 * Only unwrap `.score` when it is itself an object — a numeric/string
 * `score` means the current level already *is* the payload.
 */
export function normalizeScorePayload(raw) {
  if (!raw) return null;
  if (raw.score && typeof raw.score === "object") return raw.score;
  return raw;
}

export const healthApi = {
  timeline: (params = {}) => api.get("/health-insights/timeline", { params }).then((r) => r.data),
  score: () => api.get("/health-insights/score").then((r) => normalizeScorePayload(r.data)),
};

export default healthApi;
