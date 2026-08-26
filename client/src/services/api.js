import axios from "axios";

/**
 * Shared Axios instance for all API calls.
 * withCredentials is enabled so the httpOnly JWT cookie
 * (introduced in Phase 2) is sent automatically.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Placeholder response interceptor — Phase 2 extends this to
// redirect to /login on a 401 and surface toast errors globally.
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
