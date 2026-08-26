import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineClock, HiOutlineExclamationTriangle } from "react-icons/hi2";
import healthInsightsService from "../../services/healthInsightsService.js";
import TimelineEvent from "../../components/health/TimelineEvent.jsx";
import TimelineFilters from "../../components/health/TimelineFilters.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function groupByDay(events) {
  const groups = [];
  let currentKey = null;
  let currentGroup = null;

  events.forEach((event) => {
    const key = new Date(event.date).toDateString();
    if (key !== currentKey) {
      currentKey = key;
      currentGroup = { key, date: event.date, events: [] };
      groups.push(currentGroup);
    }
    currentGroup.events.push(event);
  });

  return groups;
}

function HealthTimelinePage() {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState("all");
  const [events, setEvents] = useState(null);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const formatDayHeading = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return t("timeline.today");
    if (date.toDateString() === yesterday.toDateString()) return t("timeline.yesterday");
    return date.toLocaleDateString(language, { month: "short", day: "numeric", year: "numeric" });
  };

  const load = (type = filter) => {
    setLoading(true);
    setError(false);
    healthInsightsService
      .timeline({ type })
      .then((data) => {
        setEvents(data.events);
        if (data.counts) setCounts(data.counts);
      })
      .catch((err) => {
        setError(true);
        toast.error(err.response?.data?.message || t("timeline.loadFailed"));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const dayGroups = events ? groupByDay(events) : [];

  return (
    <div className="container-shell max-w-3xl py-16">
      <span className="section-eyebrow">{t("timeline.pageEyebrow")}</span>
      <h1 className="mt-3 text-3xl font-bold text-white">{t("timeline.pageTitle")}</h1>
      <p className="mt-2 text-mist-300">{t("timeline.pageDescription")}</p>

      <div className="mt-6">
        <TimelineFilters active={filter} onChange={setFilter} counts={counts} />
      </div>

      <div className="mt-8">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <div className="glass-panel flex flex-col items-center gap-3 p-12 text-center">
            <HiOutlineExclamationTriangle className="h-8 w-8 text-alert-400" />
            <p className="text-sm text-mist-300">{t("timeline.loadErrorBody")}</p>
            <button type="button" onClick={() => load(filter)} className="btn-secondary !px-4 !py-2 text-sm">
              {t("timeline.retry")}
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="glass-panel flex flex-col items-center gap-3 p-16 text-center">
            <HiOutlineClock className="h-10 w-10 text-mist-400" />
            <h2 className="text-lg font-semibold text-white">{t("timeline.nothingYetTitle")}</h2>
            <p className="max-w-sm text-sm text-mist-300">
              {filter === "all" ? t("timeline.nothingYetAllBody") : t("timeline.nothingYetFilteredBody")}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {dayGroups.map((group) => (
              <div key={group.key}>
                <h2 className="mb-3 text-sm font-semibold text-white">
                  {formatDayHeading(group.date)}
                </h2>
                <div className="glass-panel divide-y divide-white/5 p-5">
                  {group.events.map((event) => (
                    <div key={event.id} className="py-3 first:pt-0 last:pb-0">
                      <TimelineEvent event={event} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthTimelinePage;
