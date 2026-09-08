import api from "./api";

// Not in the original mobile screen list, but the backend already exposes
// it and it costs nothing to wire up centrally — kept unused by any screen
// yet so it doesn't expand scope; available for a future Diet Guide screen.
export const dietApi = {
  context: () => api.get("/diet/context").then((r) => r.data),
  generate: (payload) => api.post("/diet/generate", payload).then((r) => r.data),
  regenerate: (id) => api.post(`/diet/${id}/regenerate`).then((r) => r.data),
  history: (params = {}) => api.get("/diet/history", { params }).then((r) => r.data),
  getById: (id) => api.get(`/diet/${id}`).then((r) => r.data),
  remove: (id) => api.delete(`/diet/${id}`).then((r) => r.data),
};

export default dietApi;
