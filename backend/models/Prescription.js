import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // File storage
    fileUrl: { type: String, required: true }, // public path served via /uploads
    filePath: { type: String, required: true, select: false }, // absolute disk path
    originalName: { type: String, required: true },
    fileType: { type: String, enum: ["image", "pdf"], required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },

    // OCR results (now produced by Gemini Vision, not Tesseract)
    ocrText: { type: String, default: "" },
    ocrConfidence: { type: Number, min: 0, max: 1, default: 0 },
    // Diagnosis/advice Gemini found on the prescription that isn't a
    // medicine line — distinct from `notes` below, which is user-editable.
    aiDoctorNotes: { type: String, default: "" },

    // Optional metadata the user can fill in / OCR may detect
    doctorName: { type: String, trim: true, default: null },
    prescriptionDate: { type: Date, default: null },
    notes: { type: String, trim: true, default: null },

    medicines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
      },
    ],

    // Populated by Phase 4's drug-interaction check across all of the
    // user's currently-confirmed medicines (not just this prescription).
    interactions: [
      {
        medicineA: { type: String, required: true },
        medicineB: { type: String, required: true },
        severity: { type: String, enum: ["mild", "moderate", "severe"], required: true },
        description: { type: String, required: true },
      },
    ],
    interactionsCheckedAt: { type: Date, default: null },
    // Language the current interaction descriptions were generated in
    // ("en" | "hi" | "gu"). The prescription summary itself isn't
    // persisted (generated fresh on every analyze), so only interactions
    // need this flag here.
    interactionsLanguage: { type: String, enum: ["en", "hi", "gu"], default: null },

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

prescriptionSchema.index({ user: 1, createdAt: -1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
