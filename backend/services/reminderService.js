import Reminder from "../models/Reminder.js";
import { defaultTimesForFrequency, computeEndDate } from "../utils/scheduleTimes.js";

/**
 * Auto-creates a recurring reminder for a medicine once it's confirmed
 * (never for one still sitting in needsReview, since its dosage/frequency
 * might still be wrong). No-ops if a reminder already exists for this
 * medicine so re-confirming an edit doesn't create duplicates, and
 * no-ops for "as needed" medicines (no default times to schedule).
 *
 * @returns {Promise<import("../models/Reminder.js").default|null>}
 */
export async function autoCreateReminderForMedicine(medicine) {
  const existing = await Reminder.findOne({ medicine: medicine._id });
  if (existing) return existing;

  const times = defaultTimesForFrequency(medicine.frequency);
  if (times.length === 0) return null;

  const startDate = new Date();
  const endDate = computeEndDate(startDate, medicine.durationDays);

  return Reminder.create({
    user: medicine.user,
    medicine: medicine._id,
    prescription: medicine.prescription,
    medicineName: medicine.name,
    dosage: medicine.dosage,
    times,
    startDate,
    endDate,
  });
}

function todayAt(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function isSameTimestamp(a, b) {
  return new Date(a).getTime() === new Date(b).getTime();
}

/**
 * Computes every occurrence scheduled for "today" across all of a
 * user's active reminders, merging in whatever's already been logged
 * (taken/missed/due) and virtually filling in the rest so the view is
 * always complete even if the cron scheduler hasn't run yet for a
 * given slot.
 *
 * @returns {Promise<Array<{
 *   reminderId, medicineName, dosage, time, scheduledFor, status,
 *   logId: string|null
 * }>>}
 */
export async function getTodayOccurrences(userId) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const reminders = await Reminder.find({
    user: userId,
    active: true,
    startDate: { $lte: endOfDay },
    $or: [{ endDate: null }, { endDate: { $gte: startOfDay } }],
  });

  const occurrences = [];

  for (const reminder of reminders) {
    for (const time of reminder.times) {
      const scheduledFor = todayAt(time);

      const existingLog = reminder.logs.find((log) =>
        isSameTimestamp(log.scheduledFor, scheduledFor)
      );

      let status;
      if (existingLog) {
        status = existingLog.status;
      } else if (scheduledFor > now) {
        status = "pending"; // not due yet
      } else {
        status = "missed"; // time has passed and nothing was ever logged
      }

      occurrences.push({
        reminderId: reminder._id,
        medicine: reminder.medicine,
        medicineName: reminder.medicineName,
        dosage: reminder.dosage,
        time,
        scheduledFor,
        status,
        logId: existingLog?._id || null,
      });
    }
  }

  occurrences.sort((a, b) => a.scheduledFor - b.scheduledFor);
  return occurrences;
}

/**
 * Marks a specific occurrence as taken or missed. Creates the log
 * entry if it doesn't exist yet (covers marking a "virtual" pending/
 * missed occurrence the scheduler hasn't touched), or updates it if it
 * does (covers confirming a "due" notification that was already sent).
 */
export async function markOccurrence(reminderId, userId, scheduledFor, status) {
  const reminder = await Reminder.findOne({ _id: reminderId, user: userId });
  if (!reminder) return null;

  const target = new Date(scheduledFor);
  let log = reminder.logs.find((l) => isSameTimestamp(l.scheduledFor, target));

  if (log) {
    log.status = status;
    if (status === "taken") log.takenAt = new Date();
  } else {
    reminder.logs.push({
      scheduledFor: target,
      status,
      takenAt: status === "taken" ? new Date() : null,
    });
  }

  await reminder.save();
  return reminder;
}

export default { autoCreateReminderForMedicine, getTodayOccurrences, markOccurrence };
