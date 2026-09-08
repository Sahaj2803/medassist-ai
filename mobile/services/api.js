import axios from "axios";
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "../constants/config";
import secureStorage from "../utils/secureStorage";

/**
 * Shared Axios instance for every backend call the mobile app makes.
 * Mirrors client/src/services/api.js, but authenticates with a Bearer
 * token from SecureStore instead of `withCredentials` cookies — React
 * Native has no browser cookie jar, so the existing backend's
 * Authorization-header fallback (backend/middleware/auth.js) is used
 * instead. No backend change was required for this.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await secureStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 handling (expired/invalid session) is surfaced to a single place —
// AuthContext subscribes via `registerUnauthorizedHandler` so every screen
// gets consistent "session expired, please log in again" behavior without
// each screen re-implementing it.
let onUnauthorized = null;
export const registerUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

/** Normalizes Axios/network errors into a plain, user-friendly message. */
export const getErrorMessage = (error) => {
  if (!error?.response) {
    return "Can't reach the server. Check your connection and try again.";
  }
  const data = error.response.data;
  if (data?.message) return data.message;
  if (data?.errors?.length) return data.errors.map((e) => e.msg || e.message).join(", ");
  if (error.response.status === 401) return "Your session has expired. Please log in again.";
  if (error.response.status >= 500) return "Something went wrong on our end. Please try again.";
  return "Something went wrong. Please try again.";
};

export default api;
