import {
  HiOutlineDocumentText,
  HiOutlineBeaker,
  HiOutlineSparkles,
  HiOutlineBellAlert,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { useLanguage } from "../../hooks/useLanguage.js";

const EVENT_ICON = {
  prescription_uploaded: { Icon: HiOutlineDocumentText, className: "text-brand-300" },
  prescription_analyzed: { Icon: HiOutlineSparkles, className: "text-signal-400" },
  medicine_added: { Icon: HiOutlineDocumentText, className: "text-brand-300" },
  medicine_explained: { Icon: HiOutlineSparkles, className: "text-signal-400" },
  lab_report_uploaded: { Icon: HiOutlineBeaker, className: "text-brand-300" },
  lab_report_analyzed: { Icon: HiOutlineSparkles, className: "text-signal-400" },
  reminder_created: { Icon: HiOutlineBellAlert, className: "text-brand-300" },
  dose_taken: { Icon: HiOutlineCheckCircle, className: "text-signal-400" },
  dose_missed: { Icon: HiOutlineXCircle, className: "text-alert-400" },
};

// Maps each event "kind" from the backend (see healthInsightsService.js)
// to its localized title key and, where needed, a function building the
// localized description from the event's raw meta counts. Every string
// here comes from the current language's translation dictionary — the
// backend never sends pre-built English text (see "AI Health Timeline"
// comment in the service itself).
function useEventText() {
  const { t } = useLanguage();

  const titleFor = (kind) => t(`timeline.${toCamel(kind)}`);

  const descriptionFor = (event) => {
    if (event.detail) return event.detail;
    if (event.kind === "prescription_analyzed") {
      const count = event.meta?.interactionCount || 0;
      return count > 0
        ? t(count === 1 ? "timeline.interactionsFoundOne" : "timeline.interactionsFoundMany").replace(
            "{count}",
            count
          )
        : t("timeline.noInteractionsDetected");
    }
    if (event.kind === "lab_report_analyzed") {
      const count = event.meta?.abnormalCount || 0;
      return count > 0
        ? t(count === 1 ? "timeline.valuesOutsideRangeOne" : "timeline.valuesOutsideRangeMany").replace(
            "{count}",
            count
          )
        : t("timeline.allValuesWithinRange");
    }
    return null;
  };

  return { titleFor, descriptionFor };
}

function toCamel(kind) {
  return kind.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

const TYPE_LABEL_KEY = {
  prescriptions: "typePrescription",
  medicines: "typeMedicine",
  labReports: "typeLabReport",
  reminders: "typeReminder",
};

function TimelineEvent({ event }) {
  const { t } = useLanguage();
  const { titleFor, descriptionFor } = useEventText();
  const { Icon, className } = EVENT_ICON[event.kind] || {
    Icon: HiOutlineDocumentText,
    className: "text-mist-300",
  };
  const description = descriptionFor(event);

  return (
    <div className="flex gap-3">
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ${className}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-mist-400">
            {t(`timeline.${TYPE_LABEL_KEY[event.type] || "typePrescription"}`)}
          </span>
          <span className="text-xs text-mist-500">
            {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-white">{titleFor(event.kind)}</p>
        {description && <p className="mt-0.5 text-sm text-mist-300">{description}</p>}
      </div>
    </div>
  );
}

export default TimelineEvent;
