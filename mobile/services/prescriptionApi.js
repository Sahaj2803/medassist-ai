import api from "./api";
import { UPLOAD_TIMEOUT_MS } from "../constants/config";

/**
 * Builds a React Native-compatible multipart file part from an
 * expo-image-picker / expo-document-picker asset. RN's fetch/FormData
 * needs { uri, name, type } rather than a browser File object — this is
 * the one genuine platform difference from client/src/services/prescriptionService.js.
 * The field name ("file") and endpoint are unchanged, matching
 * backend/middleware/upload.js's multer().single("file").
 */
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

export const prescriptionApi = {
  upload: (asset, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", buildFilePart(asset));
    return api
      .post("/prescriptions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: UPLOAD_TIMEOUT_MS,
        onUploadProgress,
      })
      .then((r) => r.data);
  },

  list: (params = {}) => api.get("/prescriptions", { params }).then((r) => r.data),
  getById: (id) => api.get(`/prescriptions/${id}`).then((r) => r.data),
  update: (id, payload) => api.put(`/prescriptions/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/prescriptions/${id}`).then((r) => r.data),
  updateMedicine: (prescriptionId, medicineId, payload) =>
    api.put(`/prescriptions/${prescriptionId}/medicines/${medicineId}`, payload).then((r) => r.data),
  addMedicine: (prescriptionId, payload) =>
    api.post(`/prescriptions/${prescriptionId}/medicines`, payload).then((r) => r.data),
  analyze: (prescriptionId) =>
    api.post(`/prescriptions/${prescriptionId}/analyze`).then((r) => r.data),
};

export default prescriptionApi;
