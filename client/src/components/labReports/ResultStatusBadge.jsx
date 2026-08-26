import { useLanguage } from "../../hooks/useLanguage.js";

const STATUS_KEYS = {
  within_range: "statusWithinRange",
  above_range: "statusAboveRange",
  below_range: "statusBelowRange",
  undetermined: "statusUndetermined",
};

const STATUS_STYLES = {
  within_range: "bg-signal-500/15 text-signal-400 border-signal-500/30",
  above_range: "bg-alert-500/15 text-alert-400 border-alert-500/30",
  below_range: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  undetermined: "bg-white/10 text-mist-300 border-white/15",
};

function ResultStatusBadge({ status }) {
  const { t } = useLanguage();
  const classes = STATUS_STYLES[status] || STATUS_STYLES.undetermined;
  const label = t(`labReports.${STATUS_KEYS[status] || STATUS_KEYS.undetermined}`);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

export default ResultStatusBadge;
