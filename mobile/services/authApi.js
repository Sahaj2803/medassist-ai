import api from "./api";

// Mirrors client/src/services/authService.js exactly — same endpoints,
// same contract. Reused as-is; nothing here duplicates backend logic.
export const authApi = {
  register: (payload) => api.post("/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  getMe: () => api.get("/auth/me").then((r) => r.data),
  updateProfile: (payload) => api.put("/auth/profile", payload).then((r) => r.data),
  updatePassword: (payload) => api.put("/auth/update-password", payload).then((r) => r.data),
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload).then((r) => r.data),
  resetPassword: (resetToken, payload) =>
    api.put(`/auth/reset-password/${resetToken}`, payload).then((r) => r.data),
};

export default authApi;
