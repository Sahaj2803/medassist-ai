import api from "./api";

/**
 * Diet Guide (AI Personalized Medical Diet Guide). Every call here hits
 * the existing backend diet endpoints (backend/routes/diet.routes.js +
 * backend/controllers/diet.controller.js) — same contract the web client
 * uses via client/src/services/dietService.js. Response shapes below are
 * taken directly from the backend controller, not guessed:
 *   GET  /diet/context      -> { success, labReports: [...], medicines: [...] }
 *   POST /diet/generate     -> { success, dietGuide }
 *   POST /diet/:id/regenerate -> { success, dietGuide }
 *   GET  /diet/history      -> { success, dietGuides: [...], pagination }
 *   GET  /diet/:id          -> { success, dietGuide }
 *   DELETE /diet/:id        -> { success, message }
 */
export const dietApi = {
  context: () => api.get("/diet/context").then((r) => r.data),
  generate: (payload = {}) => api.post("/diet/generate", payload).then((r) => r.data),
  regenerate: (id) => api.post(`/diet/${id}/regenerate`).then((r) => r.data),
  history: (params = {}) => api.get("/diet/history", { params }).then((r) => r.data),
  getById: (id) => api.get(`/diet/${id}`).then((r) => r.data),
  remove: (id) => api.delete(`/diet/${id}`).then((r) => r.data),
};

/** Unwraps { dietGuide } down to the diet guide document itself. */
export function normalizeDietPlan(raw) {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw.dietGuide;
  return candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : null;
}

/**
 * The /diet/context response has no wrapper — labReports/medicines sit
 * directly on the payload alongside `success`. Strip `success` so it's
 * never accidentally rendered as a profile field.
 */
export function normalizeDietContext(raw) {
  if (!raw || typeof raw !== "object") return null;
  const { success, ...context } = raw;
  return context;
}

/** Unwraps { dietGuides } down to an array. */
export function normalizeDietList(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  return Array.isArray(raw.dietGuides) ? raw.dietGuides : [];
}

export default dietApi;
