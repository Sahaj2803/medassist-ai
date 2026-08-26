import { useLanguage } from "../../hooks/useLanguage.js";

const STATUS_KEYS = {
  processing: "statusProcessing",
  needs_review: "statusNeedsReview",
  processed: "statusProcessed",
  failed: "statusFailed",
};

const STATUS_STYLES = {
  processing: "bg-brand-500/15 text-brand-300 border-brand-500/30",
  needs_review: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  processed: "bg-signal-500/15 text-signal-400 border-signal-500/30",
  failed: "bg-alert-500/15 text-alert-400 border-alert-500/30",
};

function StatusBadge({ status }) {
  const { t } = useLanguage();
  const classes = STATUS_STYLES[status] || STATUS_STYLES.processing;
  const label = t(`prescriptions.${STATUS_KEYS[status] || STATUS_KEYS.processing}`);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
