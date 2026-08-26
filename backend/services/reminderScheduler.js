import cron from "node-cron";
import Reminder from "../models/Reminder.js";
import { sendReminderEmail } from "./emailService.js";

// A "due" dose that's never marked taken becomes "missed" after this
// long, so the dashboard doesn't show a 6-hour-old dose as still "due".
const MISSED_GRACE_PERIOD_MS = 3 * 60 * 60 * 1000; // 3 hours

function currentHHmm(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(
    2,
    "0"
  )}`;
}

function todayAt(timeStr, base = new Date()) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Finds every active reminder whose schedule includes the current
 * HH:mm, creates a "due" log entry for it (skipping ones already
 * logged for that exact minute — cron ticks every minute so this
 * guards against double-firing), and dispatches notifications over
 * whichever channels are enabled for that reminder.
 */
async function dispatchDueReminders() {
  const now = new Date();
  const nowLabel = currentHHmm(now);

  const reminders = await Reminder.find({
    active: true,
    times: nowLabel,
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  }).populate("user", "name email phone");

  for (const reminder of reminders) {
    const scheduledFor = todayAt(nowLabel, now);
    const alreadyLogged = reminder.logs.some(
      (log) => log.scheduledFor.getTime() === scheduledFor.getTime()
    );
    if (alreadyLogged) continue;

    const channelsNotified = [];

    if (reminder.channels.email && reminder.user?.email) {
      const sent = await sendReminderEmail({
        to: reminder.user.email,
        userName: reminder.user.name,
        medicineName: reminder.medicineName,
        dosage: reminder.dosage,
        time: nowLabel,
      });
      if (sent) channelsNotified.push("email");
    }

    // WhatsApp delivery has been removed. The `channels.whatsapp` flag
    // still exists on the Reminder schema (left untouched per the "do
    // not change the database schema" requirement) but is intentionally
    // never read here, so it's inert either way.

    // Browser notifications are delivered client-side (the frontend
    // polls GET /api/reminders/today and fires a Notification for any
    // newly-"due" item) rather than server push, to avoid requiring a
    // VAPID/service-worker push setup for this phase.
    if (reminder.channels.browser) channelsNotified.push("browser");

    reminder.logs.push({
      scheduledFor,
      status: "due",
      notifiedAt: now,
      channelsNotified,
    });
    await reminder.save();
  }
}

/**
 * Sweeps any "due" log entry whose scheduled time is older than the
 * grace period and was never marked "taken" — flips it to "missed" so
 * dashboards reflect reality instead of showing a stale "due" forever.
 */
async function sweepMissedReminders() {
  const cutoff = new Date(Date.now() - MISSED_GRACE_PERIOD_MS);

  const reminders = await Reminder.find({
    active: true,
    "logs.status": "due",
    "logs.scheduledFor": { $lte: cutoff },
  });

  for (const reminder of reminders) {
    let changed = false;
    reminder.logs.forEach((log) => {
      if (log.status === "due" && log.scheduledFor <= cutoff) {
        log.status = "missed";
        changed = true;
      }
    });
    if (changed) await reminder.save();
  }
}

async function tick() {
  try {
    await dispatchDueReminders();
    await sweepMissedReminders();
  } catch (err) {
    console.error(`[ReminderScheduler] Tick failed: ${err.message}`);
  }
}

let task = null;

/**
 * Starts the reminder cron job — runs once per minute. Call once from
 * server.js after the DB connection is established. Idempotent: calling
 * it twice just returns the existing task instead of double-scheduling.
 */
export function startReminderScheduler() {
  if (task) return task;

  task = cron.schedule("* * * * *", tick);
  console.log("[ReminderScheduler] Started — checking due reminders every minute.");
  return task;
}

export function stopReminderScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
}

export default { startReminderScheduler, stopReminderScheduler };
