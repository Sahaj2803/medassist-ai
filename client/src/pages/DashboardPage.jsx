import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineDocumentText, HiOutlinePhoto, HiOutlinePlus, HiOutlineBeaker, HiOutlineClock, HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { useAuth } from "../hooks/useAuth.js";
import { useLanguage } from "../hooks/useLanguage.js";
import prescriptionService from "../services/prescriptionService.js";
import reminderService from "../services/reminderService.js";
import healthInsightsService from "../services/healthInsightsService.js";
import StatusBadge from "../components/prescriptions/StatusBadge.jsx";
import StatCard from "../components/reminders/StatCard.jsx";
import OccurrenceRow from "../components/reminders/OccurrenceRow.jsx";
import TimelineEvent from "../components/health/TimelineEvent.jsx";
import HealthScoreCard from "../components/health/HealthScoreCard.jsx";

/**
 * Full dashboard: recent prescriptions (Phase 3) + today's medicines and
 * stats (Phase 5). Reminder Timeline lives on the dedicated /reminders
 * page; this is the at-a-glance summary.
 */
function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [prescriptions, setPrescriptions] = useState(null);
  const [occurrences, setOccurrences] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState(null);

  useEffect(() => {
    let cancelled = false;
    prescriptionService
      .list({ limit: 4 })
      .then((data) => {
        if (!cancelled) setPrescriptions(data.prescriptions);
      })
      .catch(() => {
        if (!cancelled) setPrescriptions([]);
      });

    reminderService
      .today()
      .then((data) => {
        if (!cancelled) setOccurrences(data.occurrences);
      })
      .catch(() => {
        if (!cancelled) setOccurrences([]);
      });

    healthInsightsService
      .timeline({ limit: 3 })
      .then((data) => {
        if (!cancelled) setTimelineEvents(data.events);
      })
      .catch(() => {
        if (!cancelled) setTimelineEvents([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleMark = async (occurrence, status) => {
    try {
      await reminderService.mark(occurrence.reminderId, occurrence.scheduledFor, status);
      setOccurrences((prev) =>
        prev.map((o) =>
          o.reminderId === occurrence.reminderId && o.scheduledFor === occurrence.scheduledFor
            ? { ...o, status }
            : o
        )
      );
    } catch {
      // handled via toast in the full reminders page; keep the dashboard quiet
    }
  };

  const todayList = (occurrences || []).filter((o) => o.status !== "taken").slice(0, 4);
  const stats = (occurrences || []).reduce(
    (acc, o) => {
      acc.total += 1;
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    { total: 0, pending: 0, due: 0, taken: 0, missed: 0 }
  );

  return (
    <div className="container-shell py-16">
      <div className="glass-panel-strong flex flex-col items-start gap-4 p-8">
        <span className="section-eyebrow">{t("nav.dashboard")}</span>
        <h1 className="text-3xl font-bold text-white">
          {t("dashboard.welcome")}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="max-w-xl text-mist-300">{t("dashboard.subtitle")}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link to="/prescriptions/upload" className="btn-primary">
            <HiOutlinePlus className="h-4 w-4" />
            {t("dashboard.uploadPrescription")}
          </Link>
          <Link to="/lab-reports/upload" className="btn-secondary">
            <HiOutlineBeaker className="h-4 w-4" />
            {t("dashboard.analyzeLabReport")}
          </Link>
          <Link to="/diet-guide" className="btn-secondary">
            <HiOutlineClipboardDocumentList className="h-4 w-4" />
            {t("dashboard.aiDietGuide")}
          </Link>
        </div>
      </div>

      <div className="mt-10 glass-panel flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-500/15">
            <HiOutlineClipboardDocumentList className="h-5 w-5 text-signal-400" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">{t("dashboard.dietGuideCardTitle")}</h2>
            <p className="mt-1 text-sm text-mist-300">{t("dashboard.dietGuideCardDescription")}</p>
          </div>
        </div>
        <Link to="/diet-guide" className="btn-primary shrink-0 !px-4 !py-2 text-sm">
          {t("dashboard.getStartedAction")}
        </Link>
      </div>

      <div className="mt-10">
        <HealthScoreCard />
      </div>

      {occurrences !== null && occurrences.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <StatCard label={t("dashboard.upcomingToday")} value={stats.pending + stats.due} accent="text-brand-300" />
          <StatCard label={t("dashboard.takenToday")} value={stats.taken} accent="text-signal-400" />
          <StatCard label={t("dashboard.missedToday")} value={stats.missed} accent="text-alert-400" />
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t("dashboard.todaysMedicines")}</h2>
          <Link to="/reminders" className="text-sm font-medium text-signal-400 hover:text-signal-500">
            {t("dashboard.viewAll")}
          </Link>
        </div>

        {occurrences === null ? (
          <p className="mt-4 text-sm text-mist-400">{t("dashboard.loading")}</p>
        ) : todayList.length === 0 ? (
          <div className="glass-panel mt-4 p-8 text-center text-sm text-mist-300">
            {t("dashboard.allCaughtUp")}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {todayList.map((o) => (
              <OccurrenceRow
                key={`${o.reminderId}-${o.scheduledFor}`}
                occurrence={o}
                onMark={handleMark}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t("dashboard.recentPrescriptions")}</h2>
          <Link to="/prescriptions" className="text-sm font-medium text-signal-400 hover:text-signal-500">
            {t("dashboard.viewAll")}
          </Link>
        </div>

        {prescriptions === null ? (
          <p className="mt-4 text-sm text-mist-400">{t("dashboard.loading")}</p>
        ) : prescriptions.length === 0 ? (
          <div className="glass-panel mt-4 p-8 text-center text-sm text-mist-300">
            {t("dashboard.noPrescriptions")}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {prescriptions.map((p) => (
              <Link
                key={p._id}
                to={`/prescriptions/${p._id}`}
                className="glass-panel flex flex-col gap-2 p-4 transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between">
                  {p.fileType === "pdf" ? (
                    <HiOutlineDocumentText className="h-5 w-5 text-signal-400" />
                  ) : (
                    <HiOutlinePhoto className="h-5 w-5 text-signal-400" />
                  )}
                  <StatusBadge status={p.status} />
                </div>
                <p className="truncate text-sm font-medium text-white">{p.originalName}</p>
                <p className="text-xs text-mist-400">
                  {new Date(p.createdAt).toLocaleDateString(language)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t("dashboard.recentActivity")}</h2>
          <Link
            to="/health/timeline"
            className="text-sm font-medium text-signal-400 hover:text-signal-500"
          >
            {t("dashboard.viewTimeline")}
          </Link>
        </div>

        {timelineEvents === null ? (
          <p className="mt-4 text-sm text-mist-400">{t("dashboard.loading")}</p>
        ) : timelineEvents.length === 0 ? (
          <div className="glass-panel mt-4 flex items-center gap-3 p-6 text-sm text-mist-300">
            <HiOutlineClock className="h-5 w-5 shrink-0 text-mist-400" />
            {t("dashboard.recentActivityEmpty")}
          </div>
        ) : (
          <div className="glass-panel mt-4 divide-y divide-white/5 p-5">
            {timelineEvents.map((event) => (
              <div key={event.id} className="py-3 first:pt-0 last:pb-0">
                <TimelineEvent event={event} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
