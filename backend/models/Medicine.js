import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
    },
    dosage: {
      type: String, // e.g. "500mg"
      trim: true,
      default: null,
    },
    frequency: {
      type: String, // e.g. "3x daily", normalized from OD/BD/TID/QID/HS/SOS
      trim: true,
      default: null,
    },
    durationDays: {
      type: Number,
      default: null,
    },
    instructions: {
      type: String, // e.g. "After food"
      trim: true,
      default: null,
    },
    rawLine: {
      type: String, // the original OCR line this medicine was parsed from
      default: null,
    },

    // OCR/parse confidence for this specific medicine, 0-1.
    // Below the review threshold, the frontend prompts the user to confirm.
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    needsReview: {
      type: Boolean,
      default: false,
    },
    confirmedByUser: {
      type: Boolean,
      default: false,
    },

    // Populated by Gemini AI analysis (Phase 4) — null until analyzed.
    // Mixed rather than a rigid subdocument since the shape mirrors
    // whatever geminiService.analyzeMedicine returns (summary,
    // commonUses, sideEffects.common/serious, precautions, disclaimer).
    aiAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    aiAnalyzedAt: { type: Date, default: null },
    aiAnalysisError: { type: String, default: null },
    // Language the current aiAnalysis was generated in ("en" | "hi" | "gu").
    // Lets the frontend know an older record needs Re-analyze to appear in
    // the user's now-current preferred language, without a bulk migration.
    aiAnalysisLanguage: { type: String, enum: ["en", "hi", "gu"], default: null },
  },
  { timestamps: true }
);

medicineSchema.index({ user: 1, name: 1 });
// Backs the "all of this user's confirmed medicines" query used by
// chatService.buildUserContext() and the interaction-check step in
// prescription.controller.js's analyzePrescription — both run this
// exact filter shape.
medicineSchema.index({ user: 1, needsReview: 1 });

const Medicine = mongoose.model("Medicine", medicineSchema);

export default Medicine;
