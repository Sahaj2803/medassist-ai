import { Link } from "react-router-dom";
import { HiOutlineBeaker, HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { useLanguage } from "../../hooks/useLanguage.js";

const SOURCE_KEYS = {
  manual: "sourceManual",
  lab_report: "sourceLabReport",
  lab_report_and_manual: "sourceLabReportAndManual",
};

function DietGuideCard({ dietGuide }) {
  const { t, language } = useLanguage();
  const conditions = dietGuide.healthContext?.conditions || [];

  return (
    <Link
      to={`/diet-guide/${dietGuide._id}`}
      className="glass-panel flex flex-col gap-3 p-5 transition-colors hover:bg-white/[0.06]"
    >
      <div className="flex items-center justify-between">
        {dietGuide.labReport ? (
          <HiOutlineBeaker className="h-6 w-6 text-signal-400" />
        ) : (
          <HiOutlineClipboardDocumentList className="h-6 w-6 text-signal-400" />
        )}
        {dietGuide.status === "failed" && (
          <span className="inline-flex items-center rounded-full border border-alert-500/30 bg-alert-500/15 px-2.5 py-1 text-xs font-semibold text-alert-400">
            {t("diet.failed")}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-white">
        {t(`diet.${SOURCE_KEYS[dietGuide.source] || "sourceDefault"}`)}
      </p>
      <p className="text-xs text-mist-400">
        {new Date(dietGuide.generatedAt || dietGuide.createdAt).toLocaleDateString(language, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>
      {conditions.length > 0 && (
        <p className="truncate text-xs text-mist-400">{conditions.join(", ")}</p>
      )}
    </Link>
  );
}

export default DietGuideCard;
