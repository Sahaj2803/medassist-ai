import Prescription from "../models/Prescription.js";
import LabReport from "../models/LabReport.js";
import Reminder from "../models/Reminder.js";

/**
 * ============================================================================
 * AI Health Score — Phase 2
 *
 * Deliberately NOT an AI-generated number. Asking an LLM to invent a
 * 0-100 score would violate the feature's own safety requirement ("do
 * not generate arbitrary scores without explaining the basis" / "do not
 * invent data"). Instead this is a small, fully explainable, deterministic
 * aggregation over data ALREADY in the user's account — the "AI" in the
 * name refers to it being built from AI-extracted signals (Gemini's lab
 * statuses, Groq's interaction severities), not to an AI inventing the
 * number itself. Every point lost is traceable to a real record.
 * ============================================================================
 */

const SEVERITY_PENALTY = { severe: 20, moderate: 10, mild: 4 };

function scoreLabResults(labReports) {
  const allResults = labReports.flatMap((r) => r.results || []);
  if (allResults.length === 0) return null;

  // Same definition already used on the Lab Report detail page's
  // "values may need attention" count — kept identical across features
  // so a value isn't "fine" on one screen and "needs attention" on
  // another. undetermined counts toward "needs attention" here too,
  // since it doesn't confirm the value is normal.
  const withinCount = allResults.filter((r) => r.status === "within_range").length;
  const attentionCount = allResults.length - withinCount;

  return {
    score: Math.round((withinCount / allResults.length) * 100),
    withinCount,
    attentionCount,
    totalCount: allResults.length,
  };
}

function scoreInteractions(analyzedPrescriptions) {
  const allInteractions = analyzedPrescriptions.flatMap((p) => p.interactions || []);
  if (analyzedPrescriptions.length === 0) return null;

  const counts = { severe: 0, moderate: 0, mild: 0 };
  allInteractions.forEach((i) => {
    if (counts[i.severity] !== undefined) counts[i.severity] += 1;
  });

  const penalty =
    counts.severe * SEVERITY_PENALTY.severe +
    counts.moderate * SEVERITY_PENALTY.moderate +
    counts.mild * SEVERITY_PENALTY.mild;

  return {
    score: Math.max(0, 100 - penalty),
    counts,
    totalInteractions: allInteractions.length,
    prescriptionsAnalyzed: analyzedPrescriptions.length,
  };
}

function scoreAdherence(reminders) {
  const allLogs = reminders.flatMap((r) => r.logs || []);
  const taken = allLogs.filter((l) => l.status === "taken").length;
  const missed = allLogs.filter((l) => l.status === "missed").length;
  const resolved = taken + missed;

  if (resolved === 0) return null; // no completed doses yet either way

  return {
    score: Math.round((taken / resolved) * 100),
    taken,
    missed,
    resolved,
  };
}

function overallLabel(score) {
  if (score >= 85) return "good";
  if (score >= 65) return "fair";
  return "needs_attention";
}

/**
 * @param {string} userId
 * @returns {Promise<object>} either { available: false } (frontend shows
 *   a localized "not enough data yet" message) when there isn't yet
 *   enough data to compute anything meaningful, or the full structured
 *   score breakdown below. Deliberately returns codes/counts rather than
 *   pre-built English sentences — every user-facing string here is
 *   rendered client-side via the current language's translation
 *   dictionary (see HealthScoreCard.jsx), the same pattern used for the
 *   Health Timeline.
 */
export async function getHealthScore(userId) {
  const [labReports, analyzedPrescriptions, reminders] = await Promise.all([
    LabReport.find({ user: userId }).select("results").lean(),
    Prescription.find({ user: userId, interactionsCheckedAt: { $ne: null } })
      .select("interactions")
      .lean(),
    Reminder.find({ user: userId }).select("logs").lean(),
  ]);

  const lab = scoreLabResults(labReports);
  const interactions = scoreInteractions(analyzedPrescriptions);
  const adherence = scoreAdherence(reminders);

  // Only average the factors we actually have data for — a brand-new
  // user with just one lab report shouldn't be penalized for not having
  // reminder history yet. Equal weighting, not a tuned formula, so the
  // "why this score" explanation stays simple and defensible.
  const components = [
    lab && { key: "labs", ...lab },
    interactions && { key: "interactions", ...interactions },
    adherence && { key: "adherence", ...adherence },
  ].filter(Boolean);

  if (components.length === 0) {
    return { available: false };
  }

  const overallScore = Math.round(
    components.reduce((sum, c) => sum + c.score, 0) / components.length
  );

  // Structured findings — a "key" naming the finding plus whatever raw
  // counts it needs, so the frontend can render a fully localized
  // sentence (see i18n "healthScore.*" keys) without any English text
  // ever passing through the API.
  const positives = [];
  const needsAttention = [];

  if (lab) {
    if (lab.attentionCount === 0) {
      positives.push({ key: "labs_all_within_range" });
    } else {
      needsAttention.push({
        key: "labs_need_attention",
        attentionCount: lab.attentionCount,
        totalCount: lab.totalCount,
      });
    }
  }

  if (interactions) {
    if (interactions.totalInteractions === 0) {
      positives.push({ key: "no_interactions" });
    } else {
      const { severe, moderate, mild } = interactions.counts;
      needsAttention.push({ key: "interactions_flagged", severe, moderate, mild });
    }
  }

  if (adherence) {
    if (adherence.score >= 80) {
      positives.push({
        key: "good_adherence",
        score: adherence.score,
        taken: adherence.taken,
        resolved: adherence.resolved,
      });
    } else {
      needsAttention.push({ key: "low_adherence", score: adherence.score, missed: adherence.missed });
    }
  }

  return {
    available: true,
    score: overallScore,
    overall: overallLabel(overallScore),
    positives,
    needsAttention,
    // Raw counts backing the "generated from…" explanation line, rendered
    // client-side (see healthScore.explanation* i18n keys).
    sources: {
      labReportsCount: lab ? labReports.length : 0,
      analyzedPrescriptionsCount: interactions ? interactions.prescriptionsAnalyzed : 0,
      hasAdherenceHistory: Boolean(adherence),
    },
    generatedAt: new Date().toISOString(),
  };
}

export default { getHealthScore };
