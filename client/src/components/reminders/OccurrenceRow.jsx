import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineTrash } from "react-icons/hi2";
import { useLanguage } from "../../hooks/useLanguage.js";

function useStatusStyles() {
  const { t } = useLanguage();
  return {
    pending: { classes: "text-mist-400", label: t("reminders.statusUpcoming") },
    due: { classes: "text-brand-300", label: t("reminders.statusDueNow") },
    taken: { classes: "text-signal-400", label: t("reminders.statusTaken") },
    missed: { classes: "text-alert-400", label: t("reminders.statusMissed") },
  };
}

function OccurrenceRow({ occurrence, onMark, onDelete }) {
  const { t } = useLanguage();
  const STATUS_STYLES = useStatusStyles();
  const style = STATUS_STYLES[occurrence.status] || STATUS_STYLES.pending;
  const canAct = occurrence.status === "pending" || occurrence.status === "due" || occurrence.status === "missed";

  return (
    <div className="glass-panel flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
          <HiOutlineClock className="h-4 w-4 text-mist-300" />
        </span>
        <div>
          <p className="text-sm font-medium text-white">{occurrence.medicineName}</p>
          <p className="text-xs text-mist-400">
            {occurrence.time}
            {occurrence.dosage ? ` · ${occurrence.dosage}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold ${style.classes}`}>{style.label}</span>
        {canAct && occurrence.status !== "taken" && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onMark(occurrence, "taken")}
              title={t("reminders.markAsTaken")}
              className="rounded-lg p-1.5 text-signal-400 hover:bg-signal-500/10"
            >
              <HiOutlineCheckCircle className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onMark(occurrence, "missed")}
              title={t("reminders.markAsMissed")}
              className="rounded-lg p-1.5 text-alert-400 hover:bg-alert-500/10"
            >
              <HiOutlineXCircle className="h-5 w-5" />
            </button>
          </div>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(occurrence)}
            title={t("reminders.deleteReminderTitle")}
            className="rounded-lg p-1.5 text-mist-400 hover:bg-alert-500/10 hover:text-alert-400"
          >
            <HiOutlineTrash className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default OccurrenceRow;
