import api from "./api.js";

export const adminService = {
  getStats: () => api.get("/admin/stats").then((r) => r.data),
  listUsers: (params = {}) => api.get("/admin/users", { params }).then((r) => r.data),
  getUser: (id) => api.get(`/admin/users/${id}`).then((r) => r.data),
  updateRole: (id, role) =>
    api.put(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  setSuspension: (id, isSuspended) =>
    api.put(`/admin/users/${id}/suspend`, { isSuspended }).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  listPrescriptions: (params = {}) =>
    api.get("/admin/prescriptions", { params }).then((r) => r.data),
};

export default adminService;
