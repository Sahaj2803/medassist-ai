import { env } from "./config/env.js";
import connectDB from "./config/db.js";
import app from "./app.js";
import { startReminderScheduler } from "./services/reminderScheduler.js";

const startServer = async () => {
  await connectDB();
  startReminderScheduler();

  const server = app.listen(env.PORT, () => {
    console.log(
      `[Server] MedAssist API running in ${env.NODE_ENV} mode on port ${env.PORT}`
    );
  });

  // Graceful shutdown & safety net for unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    console.error(`[UnhandledRejection] ${err.message}`);
    server.close(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    console.log("[Server] SIGTERM received. Shutting down gracefully.");
    server.close(() => process.exit(0));
  });
};

startServer();
