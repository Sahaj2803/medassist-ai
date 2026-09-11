import cron from "node-cron";
import Reminder from "../models/Reminder.js";
import { sendReminderEmail } from "./emailService.js";
import { currentHHmm, todayAt } from "../utils/timezone.js";

// A "due" dose that's never marked taken becomes "missed" after this
// long, so the dashboard doesn't show an old dose as still "due".
const MISSED_GRACE_PERIOD_MS = 3 * 60 * 60 * 1000; // 3 hours

// Scheduler can be delayed by Render/network/server load.
// Check a small window instead of depending on one exact cron minute.
const CATCH_UP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes


/**
 * Finds active reminders that are due now or were due within the
 * recent catch-up window.
 *
 * This prevents a reminder from being silently skipped if the cron
 * process starts a little late or a single minute is missed.
 */
async function dispatchDueReminders() {
  const now = new Date();

  const windowStart = new Date(now.getTime() - CATCH_UP_WINDOW_MS);

  const reminders = await Reminder.find({
    active: true,
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  }).populate("user", "name email phone");

  for (const reminder of reminders) {
    if (!Array.isArray(reminder.times)) continue;

    for (const scheduledTime of reminder.times) {
      if (!/^\d{2}:\d{2}$/.test(scheduledTime)) continue;

      const scheduledFor = todayAt(scheduledTime, now);

      // Only process reminders that are currently due or recently due.
      if (scheduledFor < windowStart || scheduledFor > now) {
        continue;
      }

      // Prevent duplicate notification for the same occurrence.
      const alreadyLogged = reminder.logs.some(
        (log) =>
          log.scheduledFor &&
          new Date(log.scheduledFor).getTime() === scheduledFor.getTime()
      );

      if (alreadyLogged) continue;

      const channelsNotified = [];

      if (reminder.channels?.email && reminder.user?.email) {
        const sent = await sendReminderEmail({
          to: reminder.user.email,
          userName: reminder.user.name,
          medicineName: reminder.medicineName,
          dosage: reminder.dosage,
          time: scheduledTime,
        });

        if (sent) {
          channelsNotified.push("email");
        }
      }

      // WhatsApp delivery is intentionally disabled.
      // The database flag remains untouched.

      // Browser notification is handled client-side.
      if (reminder.channels?.browser) {
        channelsNotified.push("browser");
      }

      reminder.logs.push({
        scheduledFor,
        status: "due",
        notifiedAt: new Date(),
        channelsNotified,
      });

      await reminder.save();

      console.log(
        `[ReminderScheduler] Due reminder processed: ${reminder.medicineName} at ${scheduledTime}`
      );
    }
  }
}


/**
 * Converts old "due" logs to "missed" after the grace period.
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
      if (
        log.status === "due" &&
        log.scheduledFor &&
        new Date(log.scheduledFor) <= cutoff
      ) {
        log.status = "missed";
        changed = true;
      }
    });

    if (changed) {
      await reminder.save();
    }
  }
}


async function tick() {
  try {
    console.log(
      `[ReminderScheduler] Tick started at ${new Date().toISOString()}`
    );

    await dispatchDueReminders();
    await sweepMissedReminders();

    console.log("[ReminderScheduler] Tick completed.");
  } catch (err) {
    console.error(
      `[ReminderScheduler] Tick failed: ${err.message}`,
      err
    );
  }
}


let task = null;


/**
 * Starts the reminder cron job — runs once per minute.
 */
export function startReminderScheduler() {
  if (task) return task;

  task = cron.schedule("* * * * *", tick);

  console.log(
    "[ReminderScheduler] Started — checking due reminders every minute."
  );

  return task;
}


export function stopReminderScheduler() {
  if (task) {
    task.stop();
    task = null;
  }
}


export default {
  startReminderScheduler,
  stopReminderScheduler,
};