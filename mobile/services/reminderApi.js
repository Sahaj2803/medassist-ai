import api from "./api";

// Mobile only manages reminder UI against the existing reminder API.
// Actual dose-time email delivery stays entirely server-side —
// backend/services/reminderScheduler.js (node-cron) + emailService.js —
// and does not depend on this app being open. See mobile/README.md.
export const reminderApi = {
  list: (params = {}) => api.get("/reminders", { params }).then((r) => r.data),
  today: () => api.get("/reminders/today").then((r) => r.data),
  stats: () => api.get("/reminders/stats").then((r) => r.data),
  create: (payload) => api.post("/reminders", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/reminders/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/reminders/${id}`).then((r) => r.data),
  mark: (id, scheduledFor, status) =>
    api.put(`/reminders/${id}/mark`, { scheduledFor, status }).then((r) => r.data),
};

export default reminderApi;
