import api from "./api.js";

export const prescriptionService = {
  upload: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post("/prescriptions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      })
      .then((r) => r.data);
  },

  list: (params = {}) => api.get("/prescriptions", { params }).then((r) => r.data),

  getById: (id) => api.get(`/prescriptions/${id}`).then((r) => r.data),

  update: (id, payload) =>
    api.put(`/prescriptions/${id}`, payload).then((r) => r.data),

  remove: (id) => api.delete(`/prescriptions/${id}`).then((r) => r.data),

  updateMedicine: (prescriptionId, medicineId, payload) =>
    api
      .put(`/prescriptions/${prescriptionId}/medicines/${medicineId}`, payload)
      .then((r) => r.data),

  addMedicine: (prescriptionId, payload) =>
    api.post(`/prescriptions/${prescriptionId}/medicines`, payload).then((r) => r.data),

  analyze: (prescriptionId) =>
    api.post(`/prescriptions/${prescriptionId}/analyze`).then((r) => r.data),
};

export default prescriptionService;
