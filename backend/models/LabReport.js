import mongoose from "mongoose";

const labResultSchema = new mongoose.Schema(
  {
    testName: { type: String, required: true, trim: true },
    value: { type: String, default: null },
    unit: { type: String, default: null },
    // Always the range printed on the user's own report — never a
    // hardcoded/general-knowledge range. Null means the report didn't
    // print one for this test.
    referenceRange: { type: String, default: null },
    status: {
      type: String,
      enum: ["within_range", "above_range", "below_range", "undetermined"],
      default: "undetermined",
    },
    // Structured explanation from Groq: { whatItMeasures, whyItMatters,
    // simpleExplanation, interpretation }. Mixed (not a strict
    // sub-schema) so a slightly-off AI response shape never fails
    // validation — same tolerant pattern as Medicine.aiAnalysis
    // elsewhere in the project. Populated for every test, not just
    // abnormal ones, once "Analyze with AI" has been run.
    explanation: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const labReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // File storage — same shape as Prescription.js
    fileUrl: { type: String, required: true },
    filePath: { type: String, required: true, select: false },
    originalName: { type: String, required: true },
    fileType: { type: String, enum: ["image", "pdf"], required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },

    // Extraction results (Gemini)
    labName: { type: String, trim: true, default: null },
    reportDate: { type: Date, default: null },
    results: { type: [labResultSchema], default: [] },
    ocrText: { type: String, default: "" },
    // Note naming anything extraction couldn't reliably read — surfaced
    // to the user rather than silently guessing (per the "do not pretend
    // uncertain OCR extraction is accurate" safety requirement).
    uncertainNote: { type: String, default: "" },
    confidence: { type: Number, min: 0, max: 1, default: 0 },

    // Explanation results (Groq) — separate step, same "Analyze with AI"
    // pattern already used for prescriptions.
    overallSummary: { type: String, default: null },
    // Related-test grouping (e.g. "Complete Blood Count (CBC)"),
    // generated in the same Groq call as the explanations above — the
    // exact groups depend on which tests are actually present in this
    // report; empty until analyzed, and any group with no matching
    // tests is simply omitted by the AI rather than stored empty.
    groups: [
      {
        name: { type: String, required: true },
        testNames: { type: [String], default: [] },
        _id: false,
      },
    ],
    analyzedAt: { type: Date, default: null },
    // Language the current overallSummary/explanations were generated in
    // ("en" | "hi" | "gu"). Lets the frontend flag that an older analysis
    // needs Re-analyze to appear in the user's now-current language.
    analyzedLanguage: { type: String, enum: ["en", "hi", "gu"], default: null },

    status: {
      type: String,
      enum: ["processing", "needs_review", "processed", "failed"],
      default: "processing",
      index: true,
    },
    failureReason: { type: String, default: null },
  },
  { timestamps: true }
);

labReportSchema.index({ user: 1, createdAt: -1 });

const LabReport = mongoose.model("LabReport", labReportSchema);

export default LabReport;
