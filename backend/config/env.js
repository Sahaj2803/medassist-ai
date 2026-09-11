import dotenv from "dotenv";

dotenv.config();

/**
 * Single source of truth for environment variables.
 * Import `env` instead of reading process.env directly
 * across the codebase so defaults live in one place.
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  APP_TIMEZONE: process.env.APP_TIMEZONE || "Asia/Kolkata",
  MOBILE_CLIENT_URL: process.env.MOBILE_CLIENT_URL || "http://localhost:8081",

  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medassist",

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_COOKIE_EXPIRES_IN: Number(process.env.JWT_COOKIE_EXPIRES_IN || 7),

  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.6-flash",

  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",

  // SMTP_HOST: process.env.SMTP_HOST,
  // SMTP_PORT: process.env.SMTP_PORT,
  // SMTP_USER: process.env.SMTP_USER,
  // SMTP_PASS: process.env.SMTP_PASS,
  // EMAIL_FROM: process.env.EMAIL_FROM,

  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || "MedAssist Team",
  

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 200),
};

const requiredInProd = ["JWT_SECRET", "MONGO_URI"];

if (env.NODE_ENV === "production") {
  requiredInProd.forEach((key) => {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
}
