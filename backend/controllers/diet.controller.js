import DietGuide from "../models/DietGuide.js";
import LabReport from "../models/LabReport.js";
import Medicine from "../models/Medicine.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import aiGateway from "../ai/aiGateway.js";

const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"];

// Only these fields are ever read from a lab result — never the full
// Mongoose document — so nothing beyond what's actually printed on the
// user's own report reaches the AI prompt.
function pickLabResultFields(result) {
  return {
    testName: result.testName,
    value: result.value,
    unit: result.unit,
    referenceRange: result.referenceRange,
    status: result.status,
  };
}

function normalizeStringArray(value) {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : String(value).split(",");
  return arr.map((v) => String(v).trim()).filter(Boolean);
}

/**
 * Builds the healthContext sub-document from request body fields.
 * Every field is optional — missing fields are simply left empty, never
 * guessed at, per the "no fabricated medical information" safety rule.
 */
function buildHealthContextFromBody(body) {
  const age = body.age !== undefined && body.age !== "" ? Number(body.age) : null;
  if (age !== null && (Number.isNaN(age) || age < 0 || age > 130)) {
    throw new AppError("Age must be a valid number between 0 and 130", 400);
  }

  const activityLevel = body.activityLevel && ACTIVITY_LEVELS.includes(body.activityLevel)
    ? body.activityLevel
    : null;

  return {
    age,
    gender: body.gender ? String(body.gender).trim() : null,
    activityLevel,
    conditions: normalizeStringArray(body.conditions),
    symptoms: normalizeStringArray(body.symptoms),
    dietaryRestrictions: normalizeStringArray(body.dietaryRestrictions),
    allergies: normalizeStringArray(body.allergies),
    dietaryPreferences: normalizeStringArray(body.dietaryPreferences),
    medications: normalizeStringArray(body.medications),
  };
}

/**
 * Loads the caller's own lab report (if requested) and returns both the
 * light snapshot used for the AI prompt/storage and the report id, or
 * nulls when no report was selected. Throws if the report doesn't exist
 * or doesn't belong to the requesting user, so a user can never pull
 * another user's lab data into their diet guide.
 */
async function loadLabReportContext(labReportId, userId) {
  if (!labReportId) return { labReportRef: null, snapshot: null };

  const report = await LabReport.findOne({ _id: labReportId, user: userId });
  if (!report) {
    throw new AppError("Selected lab report was not found", 404);
  }

  const results = (report.results || []).map(pickLabResultFields);

  return {
    labReportRef: report._id,
    snapshot: {
      labName: report.labName || null,
      reportDate: report.reportDate || null,
      results,
    },
  };
}

/**
 * @route   GET /api/diet/context
 * @access  Private
 * @desc    Prefill data for the Diet Guide form: the user's own
 *          processed lab reports (for "Select Lab Report") and their
 *          currently confirmed medicines (for "Current medications"),
 *          so the user isn't asked to retype data the app already has.
 *          No AI call — pure read of existing records.
 */
export const getDietContext = asyncHandler(async (req, res) => {
  const [labReports, medicines] = await Promise.all([
    LabReport.find({ user: req.user.id, status: { $in: ["processed", "needs_review"] } })
      .select("labName reportDate createdAt results")
      .sort({ createdAt: -1 })
      .limit(20),
    Medicine.find({ user: req.user.id, needsReview: false })
      .select("name dosage frequency")
      .sort({ createdAt: -1 })
      .limit(30),
  ]);

  res.status(200).json({
    success: true,
    labReports: labReports.map((r) => ({
      _id: r._id,
      labName: r.labName,
      reportDate: r.reportDate,
      createdAt: r.createdAt,
      resultCount: r.results?.length || 0,
    })),
    medicines: medicines.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
    })),
  });
});

/**
 * @route   POST /api/diet/generate
 * @access  Private
 * @desc    Validates request, gathers the user's own health context
 *          (and, if provided, their own already-analyzed lab report
 *          results), calls the AI Gateway's generateDietGuide(), and
 *          stores the result. Prompt logic lives entirely in
 *          ai/prompts/diet.prompt.js — never inline here.
 */
export const generateDietGuide = asyncHandler(async (req, res) => {
  const healthContext = buildHealthContextFromBody(req.body);
  const { labReportRef, snapshot } = await loadLabReportContext(req.body.labReportId, req.user.id);

  const hasManualInfo =
    healthContext.age ||
    healthContext.gender ||
    healthContext.activityLevel ||
    healthContext.conditions.length ||
    healthContext.symptoms.length ||
    healthContext.dietaryRestrictions.length ||
    healthContext.allergies.length ||
    healthContext.dietaryPreferences.length ||
    healthContext.medications.length;

  if (!labReportRef && !hasManualInfo) {
    throw new AppError(
      "Please provide at least some health information or select a lab report to generate a diet guide",
      400
    );
  }

  const source = labReportRef && hasManualInfo
    ? "lab_report_and_manual"
    : labReportRef
      ? "lab_report"
      : "manual";

  let guide;
  try {
    guide = await aiGateway.generateDietGuide({
      healthContext,
      labReport: snapshot,
      language: req.user.preferredLanguage,
    });
  } catch (err) {
    console.error(`[Diet Guide] ${err.message}`);
    throw new AppError(err.message || "AI processing failed for this request.", err.statusCode || 502);
  }

  const dietGuide = await DietGuide.create({
    user: req.user.id,
    labReport: labReportRef,
    labReportSnapshot: snapshot || { labName: null, reportDate: null, results: [] },
    source,
    healthContext,
    guide,
    generatedAt: new Date(),
    status: "generated",
    failureReason: null,
  });

  res.status(201).json({ success: true, dietGuide });
});

/**
 * @route   POST /api/diet/:id/regenerate
 * @access  Private
 * @desc    Regenerates guidance for an existing diet guide using its
 *          stored health context, but re-reads the linked lab report
 *          fresh (if any) so the regeneration reflects the latest
 *          available data, per the "regeneration should use the latest
 *          available information" requirement.
 */
export const regenerateDietGuide = asyncHandler(async (req, res) => {
  const dietGuide = await DietGuide.findOne({ _id: req.params.id, user: req.user.id });
  if (!dietGuide) {
    throw new AppError("Diet guide not found", 404);
  }

  const { snapshot } = await loadLabReportContext(dietGuide.labReport, req.user.id);

  let guide;
  try {
    guide = await aiGateway.generateDietGuide({
      healthContext: dietGuide.healthContext,
      labReport: snapshot,
      language: req.user.preferredLanguage,
    });
  } catch (err) {
    console.error(`[Diet Guide] Regeneration failed: ${err.message}`);
    throw new AppError(err.message || "Failed to regenerate your diet guide.", err.statusCode || 502);
  }

  dietGuide.guide = guide;
  if (snapshot) dietGuide.labReportSnapshot = snapshot;
  dietGuide.generatedAt = new Date();
  dietGuide.status = "generated";
  dietGuide.failureReason = null;
  await dietGuide.save();

  res.status(200).json({ success: true, dietGuide });
});

/**
 * @route   GET /api/diet/history
 * @access  Private
 */
export const getDietGuideHistory = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter = { user: req.user.id };

  const [dietGuides, total] = await Promise.all([
    DietGuide.find(filter)
      .select("source labReport generatedAt status createdAt healthContext.conditions")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    DietGuide.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    dietGuides,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * @route   GET /api/diet/:id
 * @access  Private
 */
export const getDietGuideById = asyncHandler(async (req, res) => {
  const dietGuide = await DietGuide.findOne({ _id: req.params.id, user: req.user.id });
  if (!dietGuide) {
    throw new AppError("Diet guide not found", 404);
  }
  res.status(200).json({ success: true, dietGuide });
});

/**
 * @route   DELETE /api/diet/:id
 * @access  Private
 */
export const deleteDietGuide = asyncHandler(async (req, res) => {
  const dietGuide = await DietGuide.findOne({ _id: req.params.id, user: req.user.id });
  if (!dietGuide) {
    throw new AppError("Diet guide not found", 404);
  }
  await dietGuide.deleteOne();
  res.status(200).json({ success: true, message: "Diet guide deleted" });
});
