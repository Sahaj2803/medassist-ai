import api from "./api.js";

export const labReportService = {
  upload: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post("/lab-reports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      })
      .then((r) => r.data);
  },

  list: (params = {}) => api.get("/lab-reports", { params }).then((r) => r.data),

  getById: (id) => api.get(`/lab-reports/${id}`).then((r) => r.data),

  analyze: (id) => api.post(`/lab-reports/${id}/analyze`).then((r) => r.data),

  remove: (id) => api.delete(`/lab-reports/${id}`).then((r) => r.data),
};

export default labReportService;
