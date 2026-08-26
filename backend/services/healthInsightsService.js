import Prescription from "../models/Prescription.js";
import Medicine from "../models/Medicine.js";
import LabReport from "../models/LabReport.js";
import Reminder from "../models/Reminder.js";

/**
 * ============================================================================
 * AI Health Timeline — Phase 1
 *
 * Purely a read-time aggregation over records that already exist across
 * Prescription, Medicine, LabReport, and Reminder. No new collection, no
 * AI call, no fabricated events — every entry here maps directly to a
 * real document (or a real log entry) already owned by this user.
 * ============================================================================
 */

const TYPES = ["prescriptions", "medicines", "labReports", "reminders"];

async function prescriptionEvents(userId, limit) {
  const docs = await Prescription.find({ user: userId })
    .select("originalName status createdAt interactionsCheckedAt interactions")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const events = [];
  docs.forEach((p) => {
    events.push({
      id: `presc-upload-${p._id}`,
      type: "prescriptions",
      kind: "prescription_uploaded",
      detail: p.originalName,
      date: p.createdAt,
      meta: { status: p.status },
    });
    if (p.interactionsCheckedAt) {
      const count = p.interactions?.length || 0;
      events.push({
        id: `presc-analyze-${p._id}`,
        type: "prescriptions",
        kind: "prescription_analyzed",
        detail: null,
        date: p.interactionsCheckedAt,
        meta: { status: p.status, interactionCount: count },
      });
    }
  });
  return events;
}

async function medicineEvents(userId, limit) {
  const docs = await Medicine.find({ user: userId })
    .select("name createdAt aiAnalyzedAt needsReview")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const events = [];
  docs.forEach((m) => {
    events.push({
      id: `med-add-${m._id}`,
      type: "medicines",
      kind: "medicine_added",
      detail: m.name,
      date: m.createdAt,
      meta: { needsReview: m.needsReview },
    });
    if (m.aiAnalyzedAt) {
      events.push({
        id: `med-explain-${m._id}`,
        type: "medicines",
        kind: "medicine_explained",
        detail: m.name,
        date: m.aiAnalyzedAt,
      });
    }
  });
  return events;
}

async function labReportEvents(userId, limit) {
  const docs = await LabReport.find({ user: userId })
    .select("labName originalName status createdAt analyzedAt results")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const events = [];
  docs.forEach((r) => {
    events.push({
      id: `lab-upload-${r._id}`,
      type: "labReports",
      kind: "lab_report_uploaded",
      detail: r.labName || r.originalName,
      date: r.createdAt,
      meta: { status: r.status },
    });
    if (r.analyzedAt) {
      const abnormal = (r.results || []).filter((res) => res.status !== "within_range").length;
      events.push({
        id: `lab-analyze-${r._id}`,
        type: "labReports",
        kind: "lab_report_analyzed",
        detail: null,
        date: r.analyzedAt,
        meta: { abnormalCount: abnormal },
      });
    }
  });
  return events;
}

async function reminderEvents(userId, limit) {
  const docs = await Reminder.find({ user: userId })
    .select("medicineName createdAt logs")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const events = [];
  docs.forEach((rem) => {
    events.push({
      id: `rem-create-${rem._id}`,
      type: "reminders",
      kind: "reminder_created",
      detail: rem.medicineName,
      date: rem.createdAt,
    });
    (rem.logs || []).forEach((log) => {
      if (log.status === "taken") {
        events.push({
          id: `rem-log-${log._id}`,
          type: "reminders",
          kind: "dose_taken",
          detail: rem.medicineName,
          date: log.takenAt || log.scheduledFor,
        });
      } else if (log.status === "missed") {
        events.push({
          id: `rem-log-${log._id}`,
          type: "reminders",
          kind: "dose_missed",
          detail: rem.medicineName,
          date: log.scheduledFor,
        });
      }
      // "pending"/"due" logs aren't past events yet, so they're omitted
      // from the timeline — this is a history, not a schedule (that's
      // what /api/reminders/today already covers).
    });
  });
  return events;
}

/**
 * @param {string} userId
 * @param {{type?: "all"|"prescriptions"|"medicines"|"labReports"|"reminders", limit?: number}} options
 * @returns {Promise<{events: Array, counts: Record<string, number>}>}
 */
export async function getTimeline(userId, { type = "all", limit = 50 } = {}) {
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  // Over-fetch per source (each source capped at safeLimit independently)
  // then merge + trim to safeLimit at the end, so a user very active in
  // one area (e.g. many reminders) doesn't crowd out their only lab
  // report before the final sort/slice.
  const perSourceLimit = safeLimit;

  const wants = (t) => type === "all" || type === t;

  const [prescriptions, medicines, labReports, reminders] = await Promise.all([
    wants("prescriptions") ? prescriptionEvents(userId, perSourceLimit) : [],
    wants("medicines") ? medicineEvents(userId, perSourceLimit) : [],
    wants("labReports") ? labReportEvents(userId, perSourceLimit) : [],
    wants("reminders") ? reminderEvents(userId, perSourceLimit) : [],
  ]);

  const allEventsForCounts = type === "all"
    ? [...prescriptions, ...medicines, ...labReports, ...reminders]
    : null;

  const merged = [...prescriptions, ...medicines, ...labReports, ...reminders]
    .filter((e) => e.date) // defensive — every real doc has createdAt, but a
    // reminder log with a missing scheduledFor/takenAt could theoretically
    // slip through; never show an event with no date.
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, safeLimit);

  // Counts always reflect the full unfiltered set (fetched cheaply above
  // when type === "all"; when a filter is active, count only what's
  // already in hand for that type plus a fast estimate isn't needed —
  // the UI only needs counts to label filter tabs, computed once on the
  // unfiltered "all" call).
  const counts = allEventsForCounts
    ? TYPES.reduce((acc, t) => {
        acc[t] = allEventsForCounts.filter((e) => e.type === t).length;
        return acc;
      }, {})
    : null;

  return { events: merged, counts };
}

export default { getTimeline };
