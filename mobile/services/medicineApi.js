import api from "./api";

export const medicineApi = {
  list: (params = {}) => api.get("/medicines", { params }).then((r) => r.data),
  getById: (id) => api.get(`/medicines/${id}`).then((r) => r.data),
  analyze: (id) => api.post(`/medicines/${id}/analyze`).then((r) => r.data),
};

export default medicineApi;
