import Medicine from "../models/Medicine.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import aiGateway from "../ai/aiGateway.js";

/**
 * @route   GET /api/medicines
 * @access  Private
 * @desc    All medicines belonging to the logged-in user, optionally
 *          filtered by prescription. Powers a "my medicines" library view.
 */
export const listMedicines = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };
  if (req.query.prescriptionId) filter.prescription = req.query.prescriptionId;

  const medicines = await Medicine.find(filter).sort({ createdAt: -1 });

  res.status(200).json({ success: true, medicines });
});

/**
 * @route   GET /api/medicines/:id
 * @access  Private
 */
export const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, user: req.user.id });
  if (!medicine) {
    throw new AppError("Medicine not found", 404);
  }
  res.status(200).json({ success: true, medicine });
});

/**
 * @route   POST /api/medicines/:id/analyze
 * @access  Private
 * @desc    Runs a Groq explanation (via the AI Gateway) for a single
 *          medicine: plain-language summary, common uses, side effects,
 *          and precautions.
 */
export const analyzeMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findOne({ _id: req.params.id, user: req.user.id });
  if (!medicine) {
    throw new AppError("Medicine not found", 404);
  }

  try {
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
  } catch (err) {
    medicine.aiAnalysisError = err.message || "AI explanation failed";
    await medicine.save();
    throw err;
  }

  await medicine.save();

  res.status(200).json({ success: true, medicine });
});
