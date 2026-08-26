import { useLanguage } from "../../hooks/useLanguage.js";

function useFilters() {
  const { t } = useLanguage();
  return [
    { value: "all", label: t("timeline.filterAll") },
    { value: "prescriptions", label: t("timeline.filterPrescriptions") },
    { value: "medicines", label: t("timeline.filterMedicines") },
    { value: "labReports", label: t("timeline.filterLabReports") },
    { value: "reminders", label: t("timeline.filterReminders") },
  ];
}

function TimelineFilters({ active, onChange, counts }) {
  const FILTERS = useFilters();
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const count = counts?.[f.value];
        const isActive = active === f.value;
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(f.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "border-signal-400 bg-signal-500/10 text-signal-400"
                : "border-white/10 text-mist-300 hover:bg-white/5"
            }`}
          >
            {f.label}
            {typeof count === "number" && f.value !== "all" && (
              <span className="ml-1.5 text-mist-500">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TimelineFilters;
