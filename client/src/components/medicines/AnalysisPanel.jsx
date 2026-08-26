import { useState } from "react";
import toast from "react-hot-toast";
import {
  HiOutlineSparkles,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from "react-icons/hi2";
import medicineService from "../../services/medicineService.js";
import { useLanguage } from "../../hooks/useLanguage.js";

function AnalysisPanel({ medicine, onAnalyzed }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const { medicine: updated } = await medicineService.analyze(medicine._id);
      onAnalyzed(updated);
      setExpanded(true);
    } catch (err) {
      toast.error(err.response?.data?.message || t("medicines.couldNotAnalyze"));
    } finally {
      setLoading(false);
    }
  };

  if (!medicine.aiAnalyzedAt) {
    return (
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-signal-500/30 bg-signal-500/5 px-3 py-2 text-xs font-semibold text-signal-400 hover:bg-signal-500/10 disabled:opacity-60"
      >
        <HiOutlineSparkles className="h-3.5 w-3.5" />
        {loading ? t("common.analyzing") : t("medicines.explainWithAi")}
      </button>
    );
  }

  const analysis = medicine.aiAnalysis || {};

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-signal-400"
      >
        <span className="flex items-center gap-1.5">
          <HiOutlineSparkles className="h-3.5 w-3.5" />
          {t("common.aiExplanation")}
        </span>
        {expanded ? (
          <HiOutlineChevronUp className="h-3.5 w-3.5" />
        ) : (
          <HiOutlineChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-white/10 px-3 py-3 text-sm">
          {analysis.summary && <p className="text-mist-200">{analysis.summary}</p>}

          {analysis.commonUses?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-mist-400">
                {t("medicines.commonlyUsedFor")}
              </p>
              <p className="mt-1 text-mist-300">{analysis.commonUses.join(", ")}</p>
            </div>
          )}

          {analysis.sideEffects?.common?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-mist-400">
                {t("medicines.commonSideEffects")}
              </p>
              <p className="mt-1 text-mist-300">{analysis.sideEffects.common.join(", ")}</p>
            </div>
          )}

          {analysis.sideEffects?.serious?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-alert-400">
                {t("medicines.seriousSideEffects")}
              </p>
              <p className="mt-1 text-mist-300">{analysis.sideEffects.serious.join(", ")}</p>
            </div>
          )}

          {analysis.precautions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-mist-400">
                {t("medicines.precautions")}
              </p>
              <p className="mt-1 text-mist-300">{analysis.precautions.join(", ")}</p>
            </div>
          )}

          {analysis.disclaimer && (
            <p className="border-t border-white/10 pt-2 text-xs italic text-mist-400">
              {analysis.disclaimer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AnalysisPanel;
