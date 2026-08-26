import { asyncHandler } from "../middleware/errorHandler.js";
import healthInsightsService from "../services/healthInsightsService.js";
import healthScoreService from "../services/healthScoreService.js";

const VALID_TYPES = ["all", "prescriptions", "medicines", "labReports", "reminders"];

/**
 * @route   GET /api/health-insights/timeline
 * @access  Private
 * @desc    Chronological feed of the user's own real activity across
 *          prescriptions, medicines, lab reports, and reminders. No AI
 *          call — pure aggregation of existing timestamped records.
 * @query   type  - all|prescriptions|medicines|labReports|reminders (default: all)
 * @query   limit - max events returned, 1-200 (default: 50)
 */
export const getTimeline = asyncHandler(async (req, res) => {
  const type = VALID_TYPES.includes(req.query.type) ? req.query.type : "all";
  const { events, counts } = await healthInsightsService.getTimeline(req.user.id, {
    type,
    limit: req.query.limit,
  });

  res.status(200).json({ success: true, events, counts });
});

/**
 * @route   GET /api/health-insights/score
 * @access  Private
 * @desc    Deterministic, explainable health overview score computed
 *          from the user's own lab results, prescription interactions,
 *          and reminder adherence. Not an AI-generated number — see
 *          services/healthScoreService.js for why.
 */
export const getHealthScore = asyncHandler(async (req, res) => {
  const result = await healthScoreService.getHealthScore(req.user.id);
  res.status(200).json({ success: true, ...result });
});
