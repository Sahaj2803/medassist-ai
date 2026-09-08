import api from "./api";

export const healthApi = {
  timeline: (params = {}) => api.get("/health-insights/timeline", { params }).then((r) => r.data),
  score: () => api.get("/health-insights/score").then((r) => r.data),
};

export default healthApi;
