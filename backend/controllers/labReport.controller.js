import fs from "fs/promises";
import LabReport from "../models/LabReport.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { fileKindFromMime } from "../middleware/upload.js";
import aiGateway from "../ai/aiGateway.js";

/**
 * @route   POST /api/lab-reports/upload
 * @access  Private
 * @desc    Upload a lab report image/PDF and extract it via the AI
 *          Gateway (Gemini under the hood). This step ONLY extracts —
 *          it never explains a result or generates a summary; that's a
 *          separate "Analyze with AI" step (see analyzeLabReport below),
 *          matching the same two-step pattern already used for
 *          prescriptions (extract fast, explain on demand).
 */
export const uploadLabReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file was uploaded", 400);
  }

  const fileType = fileKindFromMime(req.file.mimetype);
  const publicPath = `/uploads/lab-reports/${req.user.id}/${req.file.filename}`;

  let labName = null;
  let reportDate = null;
  let results = [];
  let uncertainNote = "";
  let confidence = 0;
  let status = "processing";
  let failureReason = null;

  try {
    const result = await aiGateway.analyzeLabReport(req.file.path, fileType, req.file.mimetype);

    labName = result.labName || null;
    reportDate = result.reportDate ? new Date(result.reportDate) : null;
    if (reportDate && Number.isNaN(reportDate.getTime())) reportDate = null;
    results = result.results;
    uncertainNote = result.uncertainNote;
    confidence = result.confidence;

    if (results.length === 0) {
      status = "needs_review";
      failureReason =
        uncertainNote || "AI could not confidently extract any test results from this file.";
    } else if (uncertainNote) {
      status = "needs_review";
    } else {
      status = "processed";
    }
  } catch (err) {
    // AppError messages here are already user-friendly (e.g. the
    // "this PDF has no text layer" case), so surface them directly.
    status = "failed";
    failureReason = err.message || "AI processing failed for this file.";
    console.error(`[Lab Report Upload] ${err.message}`);
  }

  const labReport = await LabReport.create({
    user: req.user.id,
    fileUrl: publicPath,
    filePath: req.file.path,
    originalName: req.file.originalname,
    fileType,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    labName,
    reportDate,
    results,
    uncertainNote,
    confidence,
    status,
    failureReason,
  });

  res.status(201).json({ success: true, labReport });
});

/**
 * @route   POST /api/lab-reports/:id/analyze
 * @access  Private
 * @desc    Single Groq call (not one request per test) that returns a
 *          plain-language overall summary, a structured explanation for
 *          EVERY extracted test (not just abnormal ones), and related-
 *          test grouping (e.g. "Complete Blood Count (CBC)") based only
 *          on the tests actually present in this report.
 */
export const analyzeLabReport = asyncHandler(async (req, res) => {
  const labReport = await LabReport.findOne({ _id: req.params.id, user: req.user.id });
  if (!labReport) {
    throw new AppError("Lab report not found", 404);
  }
  if (labReport.results.length === 0) {
    throw new AppError("This report has no extracted results to analyze", 400);
  }

  const { overallSummary, explanations, groups } = await aiGateway.explainLabReport(
    {
      results: labReport.results,
      labName: labReport.labName,
      reportDate: labReport.reportDate ? labReport.reportDate.toISOString().slice(0, 10) : "",
    },
    req.user.preferredLanguage
  );

  labReport.overallSummary = overallSummary;
  labReport.results = labReport.results.map((r) => ({
    ...r.toObject(),
    explanation: explanations?.[r.testName] || r.explanation || null,
  }));

  // Only keep groups whose testNames actually match a result on this
  // report — a defensive filter in case the model names a test slightly
  // differently than it was given, so we never render an empty group.
  const resultNames = new Set(labReport.results.map((r) => r.testName));
  labReport.groups = Array.isArray(groups)
    ? groups
        .map((g) => ({
          name: g?.name,
          testNames: Array.isArray(g?.testNames)
            ? g.testNames.filter((name) => resultNames.has(name))
            : [],
        }))
        .filter((g) => g.name && g.testNames.length > 0)
    : [];

  labReport.analyzedAt = new Date();
  labReport.analyzedLanguage = req.user.preferredLanguage || "en";
  if (labReport.status === "needs_review" && !labReport.uncertainNote) {
    labReport.status = "processed";
  }
  await labReport.save();

  res.status(200).json({ success: true, labReport });
});

/**
 * @route   GET /api/lab-reports
 * @access  Private
 * @desc    Paginated lab report history for the logged-in user.
 */
export const getLabReports = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter = { user: req.user.id };
  if (req.query.status) filter.status = req.query.status;

  const [labReports, total] = await Promise.all([
    LabReport.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    LabReport.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    labReports,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * @route   GET /api/lab-reports/:id
 * @access  Private
 */
export const getLabReportById = asyncHandler(async (req, res) => {
  const labReport = await LabReport.findOne({ _id: req.params.id, user: req.user.id });
  if (!labReport) {
    throw new AppError("Lab report not found", 404);
  }
  res.status(200).json({ success: true, labReport });
});

/**
 * @route   DELETE /api/lab-reports/:id
 * @access  Private
 */
export const deleteLabReport = asyncHandler(async (req, res) => {
  const labReport = await LabReport.findOne({ _id: req.params.id, user: req.user.id }).select(
    "+filePath"
  );
  if (!labReport) {
    throw new AppError("Lab report not found", 404);
  }

  await labReport.deleteOne();

  try {
    await fs.unlink(labReport.filePath);
  } catch (err) {
    console.warn(`[LabReport] Could not delete file: ${err.message}`);
  }

  res.status(200).json({ success: true, message: "Lab report deleted" });
});
