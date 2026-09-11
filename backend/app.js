import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import { env } from "./config/env.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import prescriptionRoutes from "./routes/prescription.routes.js";
import medicineRoutes from "./routes/medicine.routes.js";
import reminderRoutes from "./routes/reminder.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import labReportRoutes from "./routes/labReport.routes.js";
import healthInsightsRoutes from "./routes/healthInsights.routes.js";
import dietRoutes from "./routes/diet.routes.js";

const app = express();

app.set("trust proxy", 1);
// ---------- Security middleware ----------
app.use(helmet());
const allowedOrigins = [
  env.CLIENT_URL,
  env.MOBILE_CLIENT_URL,
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use("/api", limiter);

// ---------- Response compression (gzip) ----------
// Applied after rate limiting (so limited requests aren't wastefully
// compressed) and before route handlers.
app.use(compression());

// ---------- Body / cookie parsing ----------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ---------- Sanitize against NoSQL injection ----------
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);

// ---------- Logging ----------
// Verbose per-request logging in development; a leaner combined-format
// log in production (useful for reverse-proxy log aggregation without
// the noise of dev-mode coloring/timing on every line).
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

// ---------- Static uploads (prescription images, added Phase 3) ----------
app.use("/uploads", express.static("uploads"));

// ---------- Routes ----------
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/lab-reports", labReportRoutes);
app.use("/api/health-insights", healthInsightsRoutes);
app.use("/api/diet", dietRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MedAssist API is running",
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
