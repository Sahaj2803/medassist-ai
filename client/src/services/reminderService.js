import api from "./api.js";

export const reminderService = {
  list: (params = {}) => api.get("/reminders", { params }).then((r) => r.data),
  today: () => api.get("/reminders/today").then((r) => r.data),
  stats: () => api.get("/reminders/stats").then((r) => r.data),
  create: (payload) => api.post("/reminders", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/reminders/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/reminders/${id}`).then((r) => r.data),
  mark: (id, scheduledFor, status) =>
    api.put(`/reminders/${id}/mark`, { scheduledFor, status }).then((r) => r.data),
};

export default reminderService;
