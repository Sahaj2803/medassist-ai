import mongoose from "mongoose";

// One entry per scheduled occurrence (e.g. "8am dose on July 27").
// Kept as a subdocument array on the parent Reminder rather than a
// separate collection since a reminder's history is always queried
// together with the reminder itself.
const reminderLogSchema = new mongoose.Schema(
  {
    scheduledFor: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "due", "taken", "missed"],
      default: "pending",
    },
    notifiedAt: { type: Date, default: null },
    takenAt: { type: Date, default: null },
    channelsNotified: { type: [String], default: [] }, // e.g. ["email", "browser"]
  },
  { _id: true }
);

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      default: null, // null for a fully custom reminder not tied to a scanned medicine
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      default: null,
    },

    // Denormalized so the reminder still reads sensibly even if the
    // source medicine is later edited or deleted.
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, default: null },

    // Daily schedule, e.g. ["08:00", "20:00"]. Server-local time (see
    // README for the timezone note) — no per-user timezone yet.
    times: {
      type: [String],
      validate: {
        validator: (arr) => arr.every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)),
        message: "Each reminder time must be in HH:mm 24-hour format",
      },
      default: [],
    },

    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, default: null }, // null = ongoing/no end date

    channels: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
      browser: { type: Boolean, default: true },
    },

    active: { type: Boolean, default: true, index: true },

    logs: { type: [reminderLogSchema], default: [] },
  },
  { timestamps: true }
);

reminderSchema.index({ user: 1, active: 1 });

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
