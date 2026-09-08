// Single source of truth for the mobile app's public configuration.
// Only public, non-secret values belong here — see mobile/.env.example.
// GEMINI_API_KEY / GROQ_API_KEY / MONGO_URI / JWT_SECRET / SMTP_* must
// NEVER appear in this file or anywhere in the mobile bundle.

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000/api";

// The backend serves uploaded prescription/lab-report images from /uploads,
// which sits one level up from /api on the same host.
export const FILE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const TOKEN_STORAGE_KEY = "medassist_auth_token";
export const USER_STORAGE_KEY = "medassist_auth_user";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "gu", label: "ગુજરાતી" },
];

export const REQUEST_TIMEOUT_MS = 30000;
export const UPLOAD_TIMEOUT_MS = 60000;
