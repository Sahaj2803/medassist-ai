import mongoose from "mongoose";

/**
 * The health context supplied for a single diet-guide generation.
 * Deliberately NOT copied onto the User model — this is per-request
 * context the user provides (or edits) each time, same pattern as
 * everything else in this schema. Kept as plain fields (not Mixed) so
 * validation catches obviously-wrong input, but every field is
 * optional since the AI must gracefully handle missing information
 * rather than requiring it.
 */
const healthContextSchema = new mongoose.Schema(
  {
    age: { type: Number, min: 0, max: 130, default: null },
    gender: { type: String, trim: true, default: null },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active", null],
      default: null,
    },
    conditions: { type: [String], default: [] },
    symptoms: { type: [String], default: [] },
    dietaryRestrictions: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    dietaryPreferences: { type: [String], default: [] },
    // Free-text medicine names the user is currently taking. Pre-filled
    // from their confirmed Medicine records where available (see
    // diet.controller.js's getDietContext), but editable/removable —
    // never fabricated by the AI.
    medications: { type: [String], default: [] },
  },
  { _id: false }
);

const dietGuideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Optional link to the lab report this guide was generated from.
    // Never null-checked away on delete of the report — see
    // diet.controller.js, which re-reads live report data at
    // generation/regeneration time rather than duplicating it here.
    labReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabReport",
      default: null,
    },
    // A light, point-in-time snapshot of ONLY the lab fields actually
    // used for this guide (testName/value/unit/referenceRange/status),
    // so history stays readable even if the source report is later
    // deleted or re-analyzed. Not a duplication of the full report —
    // just what was actually fed to the AI for this generation.
    labReportSnapshot: {
      labName: { type: String, default: null },
      reportDate: { type: Date, default: null },
      results: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },

    source: {
      type: String,
      enum: ["manual", "lab_report", "lab_report_and_manual"],
      default: "manual",
    },

    healthContext: { type: healthContextSchema, default: () => ({}) },

    // Structured AI output — { overview, healthConsiderations,
    // recommendedFoods, foodsToLimit, mealGuidance, hydrationGuidance,
    // lifestyleGuidance, importantNotes, doctorConsultation }. Mixed
    // (not a strict sub-schema) so a slightly-off AI response shape
    // never fails validation — same tolerant pattern already used for
    // Medicine.aiAnalysis and LabReport result explanations.
    guide: { type: mongoose.Schema.Types.Mixed, default: null },

    generatedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["generated", "failed"],
      default: "generated",
    },
    failureReason: { type: String, default: null },
  },
  { timestamps: true }
);

dietGuideSchema.index({ user: 1, createdAt: -1 });

const DietGuide = mongoose.model("DietGuide", dietGuideSchema);

export default DietGuide;
