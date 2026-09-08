import api from "./api";
import { UPLOAD_TIMEOUT_MS } from "../constants/config";

function buildFilePart(asset) {
  const uri = asset.uri;
  const name = asset.fileName || uri.split("/").pop() || `upload-${Date.now()}.jpg`;
  const ext = name.split(".").pop()?.toLowerCase();
  const type =
    asset.mimeType ||
    asset.type ||
    (ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg");
  return { uri, name, type };
}

export const labReportApi = {
  upload: (asset, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", buildFilePart(asset));
    return api
      .post("/lab-reports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: UPLOAD_TIMEOUT_MS,
        onUploadProgress,
      })
      .then((r) => r.data);
  },

  list: (params = {}) => api.get("/lab-reports", { params }).then((r) => r.data),
  getById: (id) => api.get(`/lab-reports/${id}`).then((r) => r.data),
  analyze: (id) => api.post(`/lab-reports/${id}/analyze`).then((r) => r.data),
  remove: (id) => api.delete(`/lab-reports/${id}`).then((r) => r.data),
};

export default labReportApi;
