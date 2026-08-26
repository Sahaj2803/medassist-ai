import fs from "fs/promises";
import Prescription from "../models/Prescription.js";
import Medicine from "../models/Medicine.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { fileKindFromMime } from "../middleware/upload.js";
import aiGateway, { REVIEW_CONFIDENCE_THRESHOLD } from "../ai/aiGateway.js";
import { autoCreateReminderForMedicine } from "../services/reminderService.js";

/**
 * @route   POST /api/prescriptions
 * @access  Private
 * @desc    Upload a prescription image/PDF and extract it via the AI
 *          Gateway (Gemini under the hood). Gemini returns fully
 *          structured medicines directly — no separate parsing step.
 *          Low-confidence extractions are flagged with needsReview
 *          instead of being trusted silently.
 *
 *          Reminders are intentionally NOT created here, even for
 *          high-confidence medicines — see the REMINDER SYSTEM note
 *          below in updateMedicine(). A reminder is only ever scheduled
 *          once the user has explicitly confirmed or edited it.
 */
export const uploadPrescription = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file was uploaded", 400);
  }

  const fileType = fileKindFromMime(req.file.mimetype);
  const publicPath = `/uploads/prescriptions/${req.user.id}/${req.file.filename}`;

  let ocrText = "";
  let ocrConfidence = 0;
  let aiDoctorNotes = "";
  let extractedMedicines = [];
  let status = "processing";
  let failureReason = null;

  try {
    const result = await aiGateway.analyzePrescription(
      req.file.path,
      fileType,
      req.file.mimetype
    );

    ocrText = result.ocrText;
    ocrConfidence = result.confidence;
    aiDoctorNotes = result.doctorNotes;
    extractedMedicines = result.medicines;

    if (!ocrText && extractedMedicines.length === 0) {
      status = "needs_review";
      failureReason = "Gemini Vision could not read enough text from this file.";
    }
  } catch (err) {
    // AppError messages here are already user-friendly (e.g. the
    // "this PDF has no text layer" case), so surface them directly.
    status = "failed";
    failureReason = err.message || "Gemini Vision processing failed for this file.";
    console.error(`[Prescription Upload] ${err.message}`);
  }

  let prescription = await Prescription.create({
    user: req.user.id,
    fileUrl: publicPath,
    filePath: req.file.path,
    originalName: req.file.originalname,
    fileType,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    ocrText,
    ocrConfidence,
    aiDoctorNotes,
    status,
    failureReason,
  });

  if (status !== "failed" && extractedMedicines.length > 0) {
    const medicineDocs = await Medicine.insertMany(
      extractedMedicines.map((m) => ({
        user: req.user.id,
        prescription: prescription._id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        durationDays: m.durationDays,
        instructions: m.instructions,
        confidence: m.confidence,
        needsReview: m.confidence < REVIEW_CONFIDENCE_THRESHOLD,
      }))
    );

    const anyNeedsReview = medicineDocs.some((m) => m.needsReview);
    prescription.medicines = medicineDocs.map((m) => m._id);
    prescription.status = anyNeedsReview ? "needs_review" : "processed";
    await prescription.save();

    // No reminders are created here, on purpose — per the REMINDER
    // SYSTEM flow, a reminder is only ever scheduled once the user has
    // reviewed the extracted medicine and confirmed or edited its
    // timings (see updateMedicine / addMedicine below), regardless of
    // how confident the extraction was.
  } else if (status !== "failed") {
    // Extraction succeeded but found zero medicines on the page.
    prescription.status = "needs_review";
    prescription.failureReason =
      "No medicines could be confidently detected. Please add them manually.";
    await prescription.save();
  }

  prescription = await Prescription.findById(prescription._id).populate("medicines");

  res.status(201).json({ success: true, prescription });
});

/**
 * @route   GET /api/prescriptions
 * @access  Private
 * @desc    Paginated prescription history for the logged-in user.
 */
export const getPrescriptions = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter = { user: req.user.id };
  if (req.query.status) filter.status = req.query.status;

  const [prescriptions, total] = await Promise.all([
    Prescription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("medicines"),
    Prescription.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    prescriptions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @route   POST /api/prescriptions/:id/analyze
 * @access  Private
 * @desc    Runs Groq explanations (via the AI Gateway) on every medicine
 *          in this prescription that hasn't been analyzed yet, cross-
 *          checks drug interactions across ALL of the user's confirmed
 *          medicines (not just this prescription), and generates a
 *          plain-language prescription summary. Structured extraction
 *          already happened at upload time (Gemini) — this step is
 *          entirely Groq, turning that structured data into
 *          human-readable explanations.
 */
export const analyzePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).populate("medicines");

  if (!prescription) {
    throw new AppError("Prescription not found", 404);
  }

  // ---- Step 1: explain each not-yet-explained medicine in this prescription ----
  const toAnalyze = prescription.medicines.filter((m) => !m.aiAnalyzedAt);

  const analysisResults = await Promise.allSettled(
    toAnalyze.map(async (medicine) => {
      const analysis = await aiGateway.medicineExplanation(
        {
          name: medicine.name,
          dosage: medicine.dosage,
          frequency: medicine.frequency,
          instructions: medicine.instructions,
        },
        req.user.preferredLanguage
      );
      medicine.aiAnalysis = analysis;
      medicine.aiAnalyzedAt = new Date();
      medicine.aiAnalysisError = null;
      medicine.aiAnalysisLanguage = req.user.preferredLanguage || "en";
      await medicine.save();
      return medicine;
    })
  );

  analysisResults.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[AI Gateway] Medicine explanation failed: ${result.reason?.message}`);
      toAnalyze[i].aiAnalysisError = result.reason?.message || "AI explanation failed";
      toAnalyze[i].save().catch(() => {});
    }
  });

  // ---- Step 2: cross-check interactions against the user's full medicine history ----
  // Include any medicine that's settled — either confidently auto-extracted
  // (never needed review) or explicitly confirmed/corrected by the user.
  // Medicines still sitting in needsReview are excluded until the person
  // confirms them, since we don't want to flag interactions against a
  // name or dosage that might still be wrong.
  const allUserMedicines = await Medicine.find({
    user: req.user.id,
    needsReview: false,
  }).select("name");

  const uniqueNames = allUserMedicines.map((m) => m.name);

  try {
    const interactions = await aiGateway.checkInteractions(uniqueNames, req.user.preferredLanguage);
    prescription.interactions = interactions;
    prescription.interactionsCheckedAt = new Date();
    prescription.interactionsLanguage = req.user.preferredLanguage || "en";
    await prescription.save();
  } catch (err) {
    console.error(`[AI Gateway] Interaction check failed: ${err.message}`);
    // Don't fail the whole request if only the interaction check breaks —
    // the per-medicine explanations above may have still succeeded.
  }

  // ---- Step 3: plain-language prescription summary (Groq) ----
  // Not persisted — the Prescription schema is intentionally left
  // unchanged, so this is generated fresh and returned alongside the
  // prescription for the dashboard to use if it wants it.
  let aiSummary = null;
  try {
    aiSummary = await aiGateway.generateSummary(
      {
        medicines: prescription.medicines.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          durationDays: m.durationDays,
          instructions: m.instructions,
        })),
        doctorNotes: prescription.aiDoctorNotes,
      },
      req.user.preferredLanguage
    );
  } catch (err) {
    console.error(`[AI Gateway] Summary generation failed: ${err.message}`);
  }

  const updated = await Prescription.findById(prescription._id).populate("medicines");

  res.status(200).json({ success: true, prescription: updated, aiSummary });
});

/**
 * @route   GET /api/prescriptions/:id
 * @access  Private
 */
export const getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).populate("medicines");

  if (!prescription) {
    throw new AppError("Prescription not found", 404);
  }

  res.status(200).json({ success: true, prescription });
});

/**
 * @route   PUT /api/prescriptions/:id
 * @access  Private
 * @desc    Update prescription-level metadata (doctor, date, notes).
 */
export const updatePrescription = asyncHandler(async (req, res) => {
  const allowedFields = ["doctorName", "prescriptionDate", "notes"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const prescription = await Prescription.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    updates,
    { new: true, runValidators: true }
  ).populate("medicines");

  if (!prescription) {
    throw new AppError("Prescription not found", 404);
  }

  res.status(200).json({ success: true, prescription });
});

/**
 * @route   DELETE /api/prescriptions/:id
 * @access  Private
 */
export const deletePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).select("+filePath");

  if (!prescription) {
    throw new AppError("Prescription not found", 404);
  }

  await Medicine.deleteMany({ prescription: prescription._id });
  await prescription.deleteOne();

  try {
    await fs.unlink(prescription.filePath);
  } catch (err) {
    console.warn(`[Prescription] Could not delete file: ${err.message}`);
  }

  res.status(200).json({ success: true, message: "Prescription deleted" });
});

/**
 * @route   PUT /api/prescriptions/:id/medicines/:medicineId
 * @access  Private
 * @desc    Confirm or correct a single low-confidence extracted medicine.
 *          Once the user has reviewed all flagged medicines, the parent
 *          prescription status is promoted to "processed".
 */
export const updateMedicine = asyncHandler(async (req, res) => {
  const { id: prescriptionId, medicineId } = req.params;

  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    user: req.user.id,
  });
  if (!prescription) {
    throw new AppError("Prescription not found", 404);
  }

  const allowedFields = ["name", "dosage", "frequency", "durationDays", "instructions"];
  const updates = { confirmedByUser: true, needsReview: false };
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const medicine = await Medicine.findOneAndUpdate(
    { _id: medicineId, prescription: prescriptionId },
    updates,
    { new: true, runValidators: true }
  );

  if (!medicine) {
    throw new AppError("Medicine not found on this prescription", 404);
  }

  const remaining = await Medicine.countDocuments({
    prescription: prescriptionId,
    needsReview: true,
  });
  if (remaining === 0 && prescription.status === "needs_review") {
    prescription.status = "processed";
    await prescription.save();
  }

  // The medicine just went from needsReview → confirmed, so it's now
  // safe to schedule reminders for it (autoCreateReminderForMedicine
  // no-ops if one already exists).
  await autoCreateReminderForMedicine(medicine);

  res.status(200).json({ success: true, medicine });
});

/**
 * @route   POST /api/prescriptions/:id/medicines
 * @access  Private
 * @desc    Manually add a medicine Gemini missed entirely.
 */
export const addMedicine = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!prescription) {
    throw new AppError("Prescription not found", 404);
  }

  const { name, dosage, frequency, durationDays, instructions } = req.body;
  if (!name) {
    throw new AppError("Medicine name is required", 400);
  }

  const medicine = await Medicine.create({
    user: req.user.id,
    prescription: prescription._id,
    name,
    dosage,
    frequency,
    durationDays,
    instructions,
    confidence: 1,
    needsReview: false,
    confirmedByUser: true,
  });

  prescription.medicines.push(medicine._id);
  await prescription.save();

  await autoCreateReminderForMedicine(medicine);

  res.status(201).json({ success: true, medicine });
});
