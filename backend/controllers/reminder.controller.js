import Reminder from "../models/Reminder.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { getTodayOccurrences, markOccurrence } from "../services/reminderService.js";

/**
 * @route   GET /api/reminders
 * @access  Private
 */
export const listReminders = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };
  if (req.query.active !== undefined) filter.active = req.query.active === "true";

  const reminders = await Reminder.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, reminders });
});

/**
 * @route   GET /api/reminders/today
 * @access  Private
 * @desc    Every dose scheduled for today across all active reminders,
 *          with status (pending/due/taken/missed). Powers the "Today's
 *          Medicines" dashboard widget and the reminder dashboard.
 */
export const getToday = asyncHandler(async (req, res) => {
  const occurrences = await getTodayOccurrences(req.user.id);
  res.status(200).json({ success: true, occurrences });
});

/**
 * @route   GET /api/reminders/stats
 * @access  Private
 * @desc    Today's counts for the dashboard's statistics widget.
 */
export const getStats = asyncHandler(async (req, res) => {
  const occurrences = await getTodayOccurrences(req.user.id);

  const stats = occurrences.reduce(
    (acc, o) => {
      acc.total += 1;
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    { total: 0, pending: 0, due: 0, taken: 0, missed: 0 }
  );

  res.status(200).json({ success: true, stats });
});

/**
 * @route   POST /api/reminders
 * @access  Private
 * @desc    Manually create a reminder (for a medicine without an
 *          auto-generated one, or a fully custom schedule).
 */
export const createReminder = asyncHandler(async (req, res) => {
  const { medicineId, medicineName, dosage, times, startDate, endDate, channels } = req.body;

  if (!medicineName || !Array.isArray(times) || times.length === 0) {
    throw new AppError("Medicine name and at least one reminder time are required", 400);
  }

  const reminder = await Reminder.create({
    user: req.user.id,
    medicine: medicineId || null,
    medicineName,
    dosage: dosage || null,
    times,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : null,
    channels: channels || undefined,
  });

  res.status(201).json({ success: true, reminder });
});

/**
 * @route   PUT /api/reminders/:id
 * @access  Private
 */
export const updateReminder = asyncHandler(async (req, res) => {
  const allowedFields = ["times", "startDate", "endDate", "channels", "active", "dosage"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const reminder = await Reminder.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    updates,
    { new: true, runValidators: true }
  );

  if (!reminder) {
    throw new AppError("Reminder not found", 404);
  }

  res.status(200).json({ success: true, reminder });
});

/**
 * @route   DELETE /api/reminders/:id
 * @access  Private
 */
export const deleteReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!reminder) {
    throw new AppError("Reminder not found", 404);
  }
  res.status(200).json({ success: true, message: "Reminder deleted" });
});

/**
 * @route   PUT /api/reminders/:id/mark
 * @access  Private
 * @desc    Marks a specific dose occurrence as taken or missed.
 */
export const markReminder = asyncHandler(async (req, res) => {
  const { scheduledFor, status } = req.body;

  if (!scheduledFor || !["taken", "missed"].includes(status)) {
    throw new AppError('scheduledFor and a status of "taken" or "missed" are required', 400);
  }

  const reminder = await markOccurrence(req.params.id, req.user.id, scheduledFor, status);
  if (!reminder) {
    throw new AppError("Reminder not found", 404);
  }

  res.status(200).json({ success: true, reminder });
});
